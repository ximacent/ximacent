import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { listPublicElections } from "@/lib/api/elections";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo";

const pages = {
  "online-voting": {
    title: "Online Voting Platform",
    description: "Run secure online voting for awards, elections, events, organizations, schools, and communities with Ximacent.",
    intro: "A practical online voting platform for organizers and voters.",
    points: ["Create public elections with categories and nominees.", "Let voters support nominees through secure Paystack checkout.", "Publish clear results and keep every voting campaign easy to follow."],
  },
  "online-awards-voting": {
    title: "Online Awards Voting",
    description: "Run online awards voting with nominee profiles, categories, paid votes, and live results.",
    intro: "Give every awards campaign a polished voting experience.",
    points: ["Organize awards into categories and nominee lists.", "Accept paid votes in Ghana cedis through Paystack.", "Share public campaign and results pages with your audience."],
  },
  "online-election-voting": {
    title: "Online Election Voting",
    description: "Use Ximacent for online election voting by organizations, schools, churches, associations, and communities.",
    intro: "Make organization and community elections easier to run online.",
    points: ["Publish candidates or nominees in clear election categories.", "Set voting windows and display election status publicly.", "Give participants a simple, mobile-friendly voting journey."],
  },
  "paid-online-voting": {
    title: "Paid Online Voting",
    description: "Run paid online voting for awards and competitions with server-verified Paystack payments and live results.",
    intro: "Paid voting that makes the payment and counting steps clear.",
    points: ["Vote quantities and amounts are calculated server-side.", "Paystack handles card details and payment checkout.", "Votes are counted only after payment confirmation."],
  },
  "voting-platform-ghana": {
    title: "Online Voting Platform Ghana",
    description: "Ximacent is an online voting platform for Ghanaian awards, events, organizations, schools, churches, and communities.",
    intro: "Online voting for Ghanaian events and organizations.",
    points: ["Run campaigns priced in Ghana cedis.", "Support Ghanaian awards, events, and organizational elections.", "Give voters a fast experience on mobile and desktop."],
  },
  "how-it-works": {
    title: "How Online Voting Works",
    description: "Learn how organizers publish elections and how voters select nominees, purchase votes, and receive confirmation.",
    intro: "From public election page to confirmed vote in a few clear steps.",
    points: ["Browse an active election and choose a category.", "Select a nominee and choose the number of votes.", "Complete Paystack checkout and wait for confirmation."],
  },
  security: {
    title: "Online Voting Security",
    description: "Learn how Ximacent verifies payments, calculates vote amounts server-side, and protects card details through Paystack.",
    intro: "Clear payment and vote-confirmation practices for online campaigns.",
    points: ["Payment amounts are calculated by the server.", "Card details are handled by Paystack, not stored by Ximacent.", "Votes are recorded after successful payment verification."],
  },
  about: {
    title: "About Ximacent",
    description: "Ximacent helps organizers run online awards voting, elections, competitions, and paid voting campaigns.",
    intro: "A focused platform for public voting campaigns.",
    points: ["Built for awards, competitions, events, and elections.", "Designed for straightforward voter journeys.", "Focused on clear campaign pages and trustworthy confirmation."],
  },
  contact: {
    title: "Contact Ximacent",
    description: "Contact Ximacent about online voting for awards, events, organizations, schools, and communities.",
    intro: "Talk to us about your next voting campaign.",
    points: ["Discuss your election or awards structure.", "Plan categories, nominees, dates, and pricing.", "Get help preparing a public voting page."],
  },
  faq: {
    title: "Online Voting FAQ",
    description: "Answers about Ximacent online voting, paid votes, Paystack checkout, election pages, and results.",
    intro: "Answers to common voter and organizer questions.",
    points: ["How do I vote? Open an election, choose a nominee, and complete checkout.", "Are card details stored? No. Paystack handles card checkout.", "When does a vote count? After payment is successfully verified."],
  },
} as const;

type Slug = keyof typeof pages;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug as Slug];
  return page ? { title: page.title, description: page.description, alternates: { canonical: `/${slug}` } } : { title: "Ximacent" };
}

export default async function SeoLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = pages[slug as Slug];
  if (!page) return null;

  let elections: Awaited<ReturnType<typeof listPublicElections>>["elections"] = [];
  if (slug === "online-voting" || slug === "online-awards-voting" || slug === "voting-platform-ghana") {
    try {
      elections = (await listPublicElections({ page: 1, limit: 6 })).elections;
    } catch {
      elections = [];
    }
  }

  return (
    <div className="container py-16 md:py-24">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.description, url: absoluteUrl(`/${slug}`) }} />
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne">Ximacent</p>
        <h1 className="mt-4 font-display text-display-md text-cream md:text-display-lg">{page.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-stone">{page.intro}</p>
        <div className="mt-10 space-y-4">
          {page.points.map((point) => <div key={point} className="flex gap-3 text-stone"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-champagne" /><p>{point}</p></div>)}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-champagne px-5 py-2.5 text-sm font-semibold text-ink hover:bg-champagne-soft">Browse elections <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/how-it-works" className="focus-ring inline-flex min-h-11 items-center rounded-md border border-border px-5 py-2.5 text-sm text-cream hover:border-champagne/50">How it works</Link>
        </div>
      </div>
      {elections.length > 0 && <section className="mt-20 border-t border-border/50 pt-10"><h2 className="font-display text-2xl text-cream">Explore active elections</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{elections.map((election) => <Link key={election.id} href={`/elections/${election.slug}`} className="surface-card p-4 hover:border-champagne/40"><h3 className="font-display text-lg text-cream">{election.title}</h3><p className="mt-2 text-sm text-stone">View categories and nominees</p></Link>)}</div></section>}
    </div>
  );
}
