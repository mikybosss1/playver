import { headers } from "next/headers";
import HomeFeedShell from "@/components/home-feed/HomeFeedShell";
import StoriesRow from "@/components/home-feed/StoriesRow";
import FeedComposer from "@/components/home-feed/FeedComposer";
import FeedTabs from "@/components/home-feed/FeedTabs";
import FeedPostCard from "@/components/home-feed/FeedPostCard";
import LiveChallengesCard from "@/components/home-feed/LiveChallengesCard";
import PeopleToFollowCard from "@/components/home-feed/PeopleToFollowCard";
import TrendingCard from "@/components/home-feed/TrendingCard";
import EventsDiscoverContent from "@/components/events/EventsDiscoverContent";
import { auth } from "@/lib/auth";
import { getEventParticipationMap, getEvents } from "@/app/actions/event";
import { getUserOrganizations } from "@/app/actions/organization";

// Sample feed posts — stand-in for real posts, which don't exist yet.
const SAMPLE_POSTS = [
  {
    authorName: "Alexei Ivanov",
    authorInitial: "A",
    authorColor: "#e21d12",
    verified: true,
    tag: "Achievement",
    subtitle: "Central Midfielder · Élite Sports Academy · 2 hours ago",
    body: "Just unlocked the Provincial Champion badge on Playver 🏆 Two consecutive LSEM titles with the boys at @elitesportsacademy. Cannot describe this feeling. Thank you to the entire coaching staff and everyone who believed in us this season.",
    hashtags: ["Soccer", "LSEM", "Provincial", "Champion"],
    achievement: { label: "Legendary Achievement", title: "Provincial Champion" },
    likes: 312,
    comments: 3,
    shares: 47,
  },
  {
    authorName: "Maria Santos",
    authorInitial: "M",
    authorColor: "#0ea5e9",
    verified: true,
    subtitle: "Forward · Soccer · Montréal · 5 hours ago",
    body: "Great session with the team today getting ready for the Spring Classic. Feeling good about where we're at heading into the tournament.",
    hashtags: ["SpringClassic2025"],
    likes: 58,
    comments: 6,
    shares: 2,
  },
];

export default async function HomeFeed({ user }: { user: { name: string; email: string } }) {
  const initial = (user.name.split(" ")[0]?.[0] ?? "?").toUpperCase();

  const [session, events, organizations] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getEvents(),
    getUserOrganizations(),
  ]);
  const joinedEventIds = session
    ? Array.from(await getEventParticipationMap(events.map((event) => event.id)))
    : [];
  // A draft (unpublished) org doesn't count as "already an organizer" — the
  // sidebar should still offer the wizard until they've actually published one.
  const hasOrganization = organizations.some((org) => org.publicationStatus === "published");

  return (
    <HomeFeedShell
      user={user}
      hasOrganization={hasOrganization}
      homeContent={
        <>
          <StoriesRow />
          <FeedComposer userInitial={initial} />
          <FeedTabs />
          {SAMPLE_POSTS.map((post) => (
            <FeedPostCard key={post.authorName} {...post} />
          ))}
        </>
      }
      rightRail={
        <>
          <LiveChallengesCard />
          <PeopleToFollowCard />
          <TrendingCard />
        </>
      }
      eventsContent={
        <EventsDiscoverContent
          events={events}
          currentUserId={session?.user?.id ?? null}
          joinedEventIds={joinedEventIds}
          showCreateButton
        />
      }
    />
  );
}
