import { getTranslations } from "next-intl/server";
import { getProfileData } from "@/app/actions/athlete";
import ProfileEditor from "@/components/ProfileEditor";

export default async function DashboardProfilePage() {
  const [t, profile] = await Promise.all([
    getTranslations("DashboardProfile"),
    getProfileData(),
  ]);

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

      <ProfileEditor
        initialName={profile.name}
        initialBio={profile.bio}
        initialMainSport={profile.mainSport}
        initialImage={profile.image}
        initialMedia={profile.media}
      />
    </div>
  );
}
