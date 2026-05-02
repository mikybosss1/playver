import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import UpcomingEvents from "@/components/UpcomingEvents";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1">
        <HeroSection />
        <HowItWorks />
        <UpcomingEvents />
      </main>
      <Footer />
    </>
  );
}
