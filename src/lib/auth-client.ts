// Client Component counterpart to auth.ts (server-only) — import signIn/signUp/
// signOut/useSession from here in "use client" files. Server Components use
// auth.api.getSession({ headers }) from auth.ts instead; don't cross-import.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
