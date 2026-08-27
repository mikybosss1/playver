import { headers } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import WhoIsPlayverFor from "@/components/home/WhoIsPlayverFor";
import FinalCta from "@/components/home/FinalCta";
import Footer from "@/components/layout/Footer";
import HomeFeed from "@/components/home-feed/HomeFeed";
import { auth } from "@/lib/auth";

// Marketing landing page for logged-out visitors; logged-in visitors get the
// social feed home page instead — this route never redirects either way.
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    return (
      <HomeFeed
        user={{
          name: session.user.name ?? "",
          email: session.user.email ?? "",
        }}
      />
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1">
        <HeroSection />
        <WhoIsPlayverFor />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
