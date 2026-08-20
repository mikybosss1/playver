import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { pool, withTransaction } from "@/lib/db";
import { resend, FROM, layout } from "@/lib/emails/_shared";
import { completeEventStripePayment } from "@/app/actions/event";

async function handleWalletTopup(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const amount = session.amount_total;
  if (!userId || !amount) return;

  await withTransaction(async (client) => {
    const ledgerInsert = await client.query(
      `INSERT INTO "wallet_transaction" (id, "userId", type, amount, "balanceAfter", "stripeSessionId")
       VALUES ($1, $2, 'deposit', $3, 0, $4)
       ON CONFLICT ("stripeSessionId") DO NOTHING
       RETURNING id`,
      [crypto.randomUUID(), userId, amount, session.id]
    );
    // Only credit the balance if this ledger row is new — a Stripe webhook
    // retry (at-least-once delivery) must not double-credit the wallet.
    if (ledgerInsert.rowCount === 0) return;

    const updateRes = await client.query(
      `UPDATE "user" SET "walletBalance" = "walletBalance" + $1 WHERE id = $2 RETURNING "walletBalance"`,
      [amount, userId]
    );
    await client.query(`UPDATE "wallet_transaction" SET "balanceAfter" = $1 WHERE "stripeSessionId" = $2`, [
      updateRes.rows[0]?.walletBalance ?? amount,
      session.id,
    ]);
  });

  revalidatePath("/dashboard/wallet");
}

async function flagPaymentDisputeForReview(charge: Stripe.Charge, reason: string) {
  console.error("[stripe webhook] payment dispute/refund needs manual review", {
    chargeId: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    reason,
  });

  const admins = await pool.query(`SELECT email FROM "user" WHERE role = 'super_admin' AND email IS NOT NULL`);
  await Promise.all(
    admins.rows.map((row: { email: string }) =>
      resend.emails
        .send({
          from: FROM,
          to: row.email,
          subject: "Playver — payment dispute needs review",
          html: layout(
            `<p>A Stripe charge was ${reason}.</p>
             <p>Charge: ${charge.id}<br/>Amount: ${(charge.amount / 100).toFixed(2)} ${charge.currency.toUpperCase()}</p>
             <p>If the underlying wallet funds have already been spent, this needs manual reconciliation.</p>`
          ),
        })
        .catch(() => {})
    )
  );
}

async function handleEventPayment(session: Stripe.Checkout.Session) {
  const eventId = session.metadata?.eventId;
  const userId = session.metadata?.userId;
  const remainderCents = session.amount_total;
  const walletCreditCents = Number(session.metadata?.walletCreditCents ?? "0");
  if (!eventId || !userId || !remainderCents) return;

  await completeEventStripePayment(eventId, userId, remainderCents, walletCreditCents, session.id);
}

async function handlePlatformEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.metadata?.type === "wallet_topup") {
      await handleWalletTopup(session);
    } else if (session.metadata?.type === "event_payment") {
      await handleEventPayment(session);
    }
    return;
  }

  if (event.type === "charge.refunded") {
    await flagPaymentDisputeForReview(event.data.object, "refunded");
    return;
  }

  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object;
    const charge = await stripe.charges.retrieve(dispute.charge as string);
    await flagPaymentDisputeForReview(charge, "disputed");
    return;
  }
}

async function handleConnectAccountEvent(event: Stripe.Event) {
  if (event.type !== "account.updated") return;
  const account = event.data.object;
  const onboarded = Boolean(account.details_submitted && account.payouts_enabled);

  const userUpdate = await pool.query(
    `UPDATE "user" SET "stripeConnectOnboarded" = $1 WHERE "stripeConnectAccountId" = $2 RETURNING id`,
    [onboarded, account.id]
  );
  if (userUpdate.rowCount && userUpdate.rowCount > 0) {
    revalidatePath("/dashboard/wallet");
    return;
  }

  await pool.query(`UPDATE "organization" SET "stripeConnectOnboarded" = $1 WHERE "stripeConnectAccountId" = $2`, [
    onboarded,
    account.id,
  ]);
  revalidatePath("/organizer/payments");
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.account) {
    await handleConnectAccountEvent(event);
  } else {
    await handlePlatformEvent(event);
  }

  return NextResponse.json({ received: true });
}
