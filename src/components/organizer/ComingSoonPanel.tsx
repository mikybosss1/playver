export default function ComingSoonPanel({
  eyebrow,
  title,
  badge,
  description,
}: {
  eyebrow: string;
  title: string;
  badge: string;
  description: string;
}) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-1">{eyebrow}</p>
      <h1 className="text-3xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {title}
      </h1>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 max-w-lg">
        <span className="inline-block mb-3 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-xs font-semibold uppercase tracking-wide">
          {badge}
        </span>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
