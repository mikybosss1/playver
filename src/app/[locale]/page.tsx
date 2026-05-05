import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import UpcomingEvents from "@/components/UpcomingEvents";
import Footer from "@/components/Footer";
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
