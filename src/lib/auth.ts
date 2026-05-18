import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { sendWelcomeEmail } from "@/lib/emails";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : [],
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
