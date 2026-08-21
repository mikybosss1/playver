// The homepage (/) — same marketing page for everyone (logged in or not);
// `isLoggedIn` only toggles an extra CTA button in HeroSection. This is
// distinct from /dashboard, which is the athlete's actual signed-in home.
import { headers } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import Footer from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { getEvents } from "@/app/actions/event";

export default async function Home() {
  const [session, events] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getEvents(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1">
        <HeroSection isLoggedIn={Boolean(session)} />
        <HowItWorks />
        <UpcomingEvents events={events} />
      </main>
      <Footer />
    </>
  );
}
