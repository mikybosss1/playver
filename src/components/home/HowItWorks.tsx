// Static 3-step "how it works" section on the public homepage; all copy
// comes from the HowItWorks i18n namespace, no data fetching.
import { getTranslations } from "next-intl/server";

export default async function HowItWorks() {
  const t = await getTranslations("HowItWorks");

  const steps = [
    { number: "01", title: t("step1Title"), desc: t("step1Desc") },
    { number: "02", title: t("step2Title"), desc: t("step2Desc") },
    { number: "03", title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
            {t("title")}
          </h2>
          <p className="text-zinc-500 text-base max-w-xl mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ number, title, desc }) => (
            <div key={number} className="flex flex-col gap-4 p-6">
              <span className="text-5xl font-bold text-zinc-300">{number}</span>
              <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
