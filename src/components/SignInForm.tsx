"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { signIn } from "@/lib/auth-client";

export default function SignInForm() {
  const t = useTranslations("SignIn");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn.email({ email, password, rememberMe });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Sign in failed.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700">{t("emailLabel")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800 transition"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700">{t("passwordLabel")}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              required
              className="w-full px-4 py-3 pr-11 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 text-zinc-800 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 accent-[#e21d12] cursor-pointer"
            />
            <span className="text-sm text-zinc-600">{t("rememberMe")}</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-[#e21d12] hover:underline font-medium">
            {t("forgotPassword")}
          </Link>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 font-medium -mt-1">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] disabled:opacity-60 transition-colors shadow-sm"
        >
          {loading ? "…" : t("submit")}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-200" />
        <span className="text-xs text-zinc-400 font-medium">or</span>
        <div className="flex-1 h-px bg-zinc-200" />
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 py-3 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-sm"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {t("googleButton")}
      </button>

      {/* Sign up link */}
      <p className="text-center text-sm text-zinc-500">
        {t("noAccount")}{" "}
        <Link href="/auth/signup" className="text-[#e21d12] font-semibold hover:underline">
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
