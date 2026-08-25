// Server-only Better Auth instance — session checks in Server Components/
// actions use `auth.api.getSession({ headers })` from here. The Client
// Component counterpart (signIn/signUp/signOut/useSession) is auth-client.ts;
// don't import this file into a "use client" component.
import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { sendWelcomeEmail } from "@/lib/emails";

const appURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: appURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    appURL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "https://playver.ca",
    "https://www.playver.ca",
    "https://stage.playver.ca",
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((v): v is string => Boolean(v)),
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.email) {
            sendWelcomeEmail(user.email, { userName: user.name ?? "Athlete" }).catch(() => {});
          }
        },
      },
    },
  },
});
