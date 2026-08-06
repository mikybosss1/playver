"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { pool, withTransaction } from "@/lib/db";

const MIN_WITHDRAWAL_CENTS = 1000; // $10

class InsufficientFundsError extends Error {}

export type WalletTransaction = {
  id: string;
  type: "deposit" | "event_payment_sent" | "event_payment_received" | "withdrawal";
  amount: number;
  balanceAfter: number;
  createdAt: string;
};

export async function getWalletOverview() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const userRow = await pool.query(
    `SELECT "walletBalance", "stripeConnectAccountId", "stripeConnectOnboarded" FROM "user" WHERE id = $1`,
    [session.user.id]
  );
  const u = userRow.rows[0];

  const txRows = await pool.query(
    `SELECT id, type, amount, "balanceAfter", "createdAt" FROM "wallet_transaction"
     WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 25`,
    [session.user.id]
  );

  return {
    balance: Number(u?.walletBalance ?? 0),
    connectAccountId: u?.stripeConnectAccountId as string | null,
    connectOnboarded: Boolean(u?.stripeConnectOnboarded),
    transactions: txRows.rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      balanceAfter: Number(r.balanceAfter),
      createdAt: new Date(r.createdAt).toISOString(),
    })) as WalletTransaction[],
  };
}

export async function createConnectOnboardingLink(): Promise<{ url?: string; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const userRow = await pool.query(`SELECT "stripeConnectAccountId" FROM "user" WHERE id = $1`, [session.user.id]);
  let accountId = userRow.rows[0]?.stripeConnectAccountId as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "CA",
      email: session.user.email,
    });
    accountId = account.id;
    await pool.query(`UPDATE "user" SET "stripeConnectAccountId" = $1 WHERE id = $2`, [accountId, session.user.id]);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/dashboard/wallet`,
    return_url: `${baseUrl}/dashboard/wallet?connect=return`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

function calculateWithdrawalFee(_amountCents: number): number {
  // Always 0 by design, not just "for now": Stripe/processing costs are meant
  // to be covered by the organizer commission taken at payment time (see
  // payForEventWithWallet/payForTeamWithWallet), not skimmed again here.
  // Deducting a fee at withdrawal too would double-charge the same cost.
  return 0;
}

export async function requestWithdrawal(amountCents: number): Promise<{ error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  if (!Number.isInteger(amountCents) || amountCents < MIN_WITHDRAWAL_CENTS) {
    return { error: "Minimum withdrawal is $10" };
  }

  const userRow = await pool.query(
    `SELECT "stripeConnectAccountId", "walletBalance" FROM "user" WHERE id = $1`,
    [session.user.id]
  );
  const u = userRow.rows[0];
  if (!u?.stripeConnectAccountId) return { error: "Connect a payout account first" };
  if (Number(u.walletBalance) < amountCents) return { error: "Insufficient balance" };

  const account = await stripe.accounts.retrieve(u.stripeConnectAccountId);
  if (!account.payouts_enabled) return { error: "Your payout account isn't fully verified yet" };

  const withdrawalId = crypto.randomUUID();
  const feeCents = calculateWithdrawalFee(amountCents);

  try {
    await withTransaction(async (client) => {
      const debit = await client.query(
        `UPDATE "user" SET "walletBalance" = "walletBalance" - $1 WHERE id = $2 AND "walletBalance" >= $1 RETURNING "walletBalance"`,
        [amountCents, session.user.id]
      );
      if (debit.rowCount === 0) throw new InsufficientFundsError();

      await client.query(
        `INSERT INTO "wallet_withdrawal" (id, "userId", amount, "platformFeeCents", status)
         VALUES ($1, $2, $3, $4, 'processing')`,
        [withdrawalId, session.user.id, amountCents, feeCents]
      );

      await client.query(
        `INSERT INTO "wallet_transaction" (id, "userId", type, amount, "balanceAfter", "withdrawalId")
         VALUES ($1, $2, 'withdrawal', $3, $4, $5)`,
        [crypto.randomUUID(), session.user.id, -amountCents, debit.rows[0].walletBalance, withdrawalId]
      );
    });
  } catch (e) {
    if (e instanceof InsufficientFundsError) return { error: "Insufficient balance" };
    console.error("[requestWithdrawal]", e);
    return { error: "Something went wrong — please try again" };
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents - feeCents,
        currency: "cad",
        destination: u.stripeConnectAccountId,
      },
      { idempotencyKey: withdrawalId }
    );
    await pool.query(
      `UPDATE "wallet_withdrawal" SET status = 'completed', "stripeTransferId" = $1 WHERE id = $2`,
      [transfer.id, withdrawalId]
    );
  } catch (e) {
    await withTransaction(async (client) => {
      await client.query(`UPDATE "user" SET "walletBalance" = "walletBalance" + $1 WHERE id = $2`, [
        amountCents,
        session.user.id,
      ]);
      await client.query(
        `UPDATE "wallet_withdrawal" SET status = 'failed', "failureReason" = $1 WHERE id = $2`,
        [e instanceof Error ? e.message : "Transfer failed", withdrawalId]
      );
      await client.query(
        `INSERT INTO "wallet_transaction" (id, "userId", type, amount, "balanceAfter", "withdrawalId")
         VALUES ($1, $2, 'withdrawal', $3, (SELECT "walletBalance" FROM "user" WHERE id = $2), $4)`,
        [crypto.randomUUID(), session.user.id, amountCents, withdrawalId]
      );
    });
    return { error: "Withdrawal failed — funds returned to your wallet" };
  }

  revalidatePath("/dashboard/wallet");
  return {};
}
