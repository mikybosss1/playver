import { getTranslations } from "next-intl/server";

export default async function DashboardWalletPage() {
  const t = await getTranslations("DashboardWallet");

  const balance = "0.00";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">
        {t("eyebrow")}
      </p>
      <h1
        className="text-3xl font-bold text-zinc-900 mb-2"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        {t("title")}
      </h1>
      <p className="text-zinc-500 text-sm mb-10">{t("subtitle")}</p>

      {/* Balance card */}
      <div className="bg-[#e21d12] rounded-2xl p-8 text-white max-w-sm mb-8 shadow-md">
        <p className="text-sm font-semibold opacity-80 mb-1">{t("balanceLabel")}</p>
        <p className="text-4xl font-bold">${balance}</p>
      </div>

      {/* Add money form */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 max-w-sm">
        <h2 className="text-base font-bold text-zinc-900 mb-6">{t("formTitle")}</h2>
        <form className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700">{t("amountLabel")}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {["10", "25", "50", "100"].map((amt) => (
              <button
                key={amt}
                type="button"
                className="flex-1 py-2 text-xs font-semibold border border-zinc-200 rounded-lg text-zinc-600 hover:border-[#e21d12] hover:text-[#e21d12] transition-colors"
              >
                ${amt}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="w-full py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow-sm"
          >
            {t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
