// node scripts/test-email.mjs
// Sends one of each email type to your own address so you can preview them.

import { Resend } from "resend";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8");

const RESEND_API_KEY = env.match(/^RESEND_API_KEY=(.+)$/m)?.[1].trim();
const BASE_URL = env.match(/^NEXT_PUBLIC_BASE_URL=(.+)$/m)?.[1].trim() ?? "https://playver.ca";

if (!RESEND_API_KEY) { console.error("RESEND_API_KEY not found in .env.local"); process.exit(1); }

const resend = new Resend(RESEND_API_KEY);
const TO   = "miky.baril3@gmail.com";
const FROM = "Playver <noreply@playver.ca>";

const EVENT = { title: "Playver 3x3 Hoop Jam", sport: "Basketball", location: "Montreal, QC", date: "June 1, 2026 at 2:00 PM", id: "test" };
const TEAM  = { name: "Playver Ballers", sport: "Basketball", location: "Montreal, QC", captain: "Mikael Baril", id: "test" };
const USER  = "Mikael";

// ── Shared helpers ───────────────────────────────────────────────────────────

function layout(body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding-bottom:28px;text-align:center;">
  <span style="font-size:26px;font-weight:900;color:#e21d12;">Playver</span>
</td></tr>
<tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
  ${body}
</td></tr>
<tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#a1a1aa;">
  © ${new Date().getFullYear()} Playver · <a href="${BASE_URL}" style="color:#a1a1aa;">playver.ca</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

const btn  = (href, label) => `<a href="${href}" style="display:inline-block;margin-top:28px;padding:14px 28px;background:#e21d12;color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;">${label}</a>`;
const row  = (icon, label, value) => `<tr><td style="padding:7px 0;"><span style="font-size:16px;margin-right:10px;">${icon}</span><span style="font-size:13px;color:#71717a;font-weight:600;text-transform:uppercase;">${label}</span></td><td style="padding:7px 0;text-align:right;"><span style="font-size:14px;color:#18181b;font-weight:600;">${value}</span></td></tr>`;
const table = (...rows) => `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f4f4f5;border-bottom:1px solid #f4f4f5;margin-bottom:8px;">${rows.join("")}</table>`;
const eyebrow = (text, color = "#e21d12") => `<p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${color};">${text}</p>`;
const h1 = text => `<h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#18181b;line-height:1.2;">${text}</h1>`;
const p  = text => `<p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">${text}</p>`;

const emails = [
  // ── 1. Event joined ─────────────────────────────────────────────────────────
  {
    subject: `You're registered for ${EVENT.title}!`,
    html: layout(`
      ${eyebrow("Registration confirmed")}
      ${h1(`You're in, ${USER}!`)}
      ${p(`You've successfully registered for <strong>${EVENT.title}</strong>. Get ready to play!`)}
      ${table(row("🏟","Event",EVENT.title), row("🏅","Sport",EVENT.sport), row("📍","Location",EVENT.location), row("📅","Date",EVENT.date))}
      <center>${btn(`${BASE_URL}/events/${EVENT.id}`, "View event →")}</center>
    `)
  },
  // ── 2. Team joined ──────────────────────────────────────────────────────────
  {
    subject: `You've joined ${TEAM.name}!`,
    html: layout(`
      ${eyebrow("Team confirmed")}
      ${h1(`Welcome to the team, ${USER}!`)}
      ${p(`You've joined <strong>${TEAM.name}</strong>. Your teammates are looking forward to playing with you.`)}
      ${table(row("👥","Team",TEAM.name), row("🏅","Sport",TEAM.sport), row("📍","Location",TEAM.location), row("🎖","Captain",TEAM.captain))}
      <center>${btn(`${BASE_URL}/teams/${TEAM.id}`, "View team →")}</center>
    `)
  },
  // ── 3. New participant (organizer) ──────────────────────────────────────────
  {
    subject: `New registration: Alex Tremblay joined ${EVENT.title}`,
    html: layout(`
      ${eyebrow("New registration")}
      ${h1("Someone just joined your event!")}
      ${p(`<strong>Alex Tremblay</strong> has registered for <strong>${EVENT.title}</strong>.`)}
      ${table(row("👤","Participant","Alex Tremblay"), row("🏟","Event",EVENT.title), row("📊","Registrations","8 / 20 spots filled"))}
      <center>${btn(`${BASE_URL}/events/${EVENT.id}`, "View participants →")}</center>
    `)
  },
  // ── 4. Event is full (organizer) ────────────────────────────────────────────
  {
    subject: `${EVENT.title} is now full!`,
    html: layout(`
      ${eyebrow("🎉 Event full")}
      ${h1("Your event is fully booked!")}
      ${p(`<strong>${EVENT.title}</strong> has reached its capacity of <strong>20 participants</strong>. No new registrations will be accepted.`)}
      <center>${btn(`${BASE_URL}/events/${EVENT.id}`, "View event →")}</center>
    `)
  },
  // ── 5. Event cancelled ──────────────────────────────────────────────────────
  {
    subject: `Cancelled: ${EVENT.title}`,
    html: layout(`
      ${eyebrow("Event cancelled")}
      ${h1(`Sorry, ${USER} — this event has been cancelled.`)}
      ${p("The event you registered for has been cancelled by the organizer. We hope to see you at a future event!")}
      ${table(row("🏟","Event",EVENT.title), row("🏅","Sport",EVENT.sport), row("📍","Location",EVENT.location), row("📅","Was scheduled",EVENT.date))}
      <center>${btn(`${BASE_URL}/events`, "Browse other events →")}</center>
    `)
  },
  // ── 6. Welcome ──────────────────────────────────────────────────────────────
  {
    subject: `Welcome to Playver, ${USER}!`,
    html: layout(`
      ${eyebrow("Welcome to Playver")}
      ${h1(`Hey ${USER}, let's play! 🏅`)}
      ${p("Your Playver account is ready. Here's what you can do:")}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="padding:8px 0;font-size:14px;color:#3f3f46;">🏟&nbsp;&nbsp;<strong>Join events</strong> — find pickup games, tournaments, and open gyms near you.</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#3f3f46;">👥&nbsp;&nbsp;<strong>Join a team</strong> — team up with other athletes in your sport.</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#3f3f46;">📅&nbsp;&nbsp;<strong>Get reminders</strong> — we'll ping you 24 h and 2 h before every event you join.</td></tr>
      </table>
      <center>${btn(`${BASE_URL}/events`, "Browse events →")}</center>
    `)
  },
  // ── 7. Payment receipt ───────────────────────────────────────────────────────
  {
    subject: `Payment confirmed — ${EVENT.title}`,
    html: layout(`
      ${eyebrow("Payment confirmed")}
      ${h1(`You're in, ${USER}!`)}
      ${p(`Your payment was successful and your spot for <strong>${EVENT.title}</strong> is confirmed.`)}
      ${table(row("🏟","Event",EVENT.title), row("🏅","Sport",EVENT.sport), row("📍","Location",EVENT.location), row("📅","Date",EVENT.date), row("💳","Amount paid","CA$15.00"))}
      <center>${btn(`${BASE_URL}/events/${EVENT.id}`, "View event →")}</center>
    `)
  },
  // ── 8. Removed from event ────────────────────────────────────────────────────
  {
    subject: `You've been removed from ${EVENT.title}`,
    html: layout(`
      ${eyebrow("Registration update")}
      ${h1("You've been removed from an event.")}
      ${p(`Hi ${USER}, an administrator has removed you from the following event. If you think this is a mistake, please reach out to the organizer.`)}
      ${table(row("🏟","Event",EVENT.title), row("🏅","Sport",EVENT.sport), row("📍","Location",EVENT.location), row("📅","Date",EVENT.date))}
      <center>${btn(`${BASE_URL}/events`, "Browse other events →")}</center>
    `)
  },
  // ── 9. Role changed ──────────────────────────────────────────────────────────
  {
    subject: `Your Playver role has been updated to Organizer`,
    html: layout(`
      ${eyebrow("Account update")}
      ${h1("Your role has been updated 🎉.")}
      ${p(`Hi ${USER}, a Playver administrator has updated your account role.`)}
      ${table(row("📋","Previous role","Player"), row("✅","New role","Organizer"))}
      <p style="margin:24px 0 0;font-size:14px;color:#52525b;line-height:1.6;">As an <strong>Organizer</strong>, you now have access to additional features on Playver.</p>
      <center>${btn(`${BASE_URL}/dashboard`, "Go to dashboard →")}</center>
    `)
  },
  // ── 10. Reminder 24h ─────────────────────────────────────────────────────────
  {
    subject: `📅 Tomorrow: ${EVENT.title}`,
    html: layout(`
      ${eyebrow("📅 Coming up tomorrow")}
      ${h1(`Your event starts tomorrow, ${USER}!`)}
      ${p(`Just a reminder that <strong>${EVENT.title}</strong> is tomorrow. Don't forget to show up and give it your all!`)}
      ${table(row("🏟","Event",EVENT.title), row("🏅","Sport",EVENT.sport), row("📍","Location",EVENT.location), row("📅","Date",EVENT.date))}
      <center>${btn(`${BASE_URL}/events/${EVENT.id}`, "View event →")}</center>
    `)
  },
  // ── 11. Reminder 2h ──────────────────────────────────────────────────────────
  {
    subject: `⚡ Starting in 2 hours: ${EVENT.title}`,
    html: layout(`
      ${eyebrow("⚡ Starting soon")}
      ${h1(`Your event starts in 2 hours, ${USER}!`)}
      ${p(`<strong>${EVENT.title}</strong> is starting very soon. Head over and get warmed up!`)}
      ${table(row("🏟","Event",EVENT.title), row("🏅","Sport",EVENT.sport), row("📍","Location",EVENT.location), row("📅","Date",EVENT.date))}
      <center>${btn(`${BASE_URL}/events/${EVENT.id}`, "View event →")}</center>
    `)
  },
];

console.log(`Sending ${emails.length} test emails to ${TO}...\n`);

for (const email of emails) {
  process.stdout.write(`  ${email.subject.slice(0, 60)}... `);
  await resend.emails.send({ from: FROM, to: TO, ...email });
  console.log("✓");
}

console.log(`\nAll ${emails.length} emails sent! Check your inbox.`);
