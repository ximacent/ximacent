import { ElectionStatus } from "@/database/entities/Election";

export interface DashboardOverview {
  totalElections: number;
  activeElections: number;
  totalCategories: number;
  totalNominees: number;
  totalVotes: number;
  totalRevenue: string;
}

export interface DashboardRevenue {
  total: string;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  period: Array<{ date: string; amount: string }>;
}

export interface DashboardActiveElection {
  id: string;
  title: string;
  slug: string;
  endDate: Date;
  totalVotes: number;
  totalRevenue: string;
}

export interface DashboardTopNominee {
  id: string;
  name: string;
  code: string;
  imageUrl: string | null;
  totalVotes: number;
  category: { id: string; name: string };
  election: { id: string; title: string };
}

export interface DashboardUpcomingElection {
  id: string;
  title: string;
  slug: string;
  startDate: Date;
}

export interface DashboardEndingSoon {
  id: string;
  title: string;
  slug: string;
  endDate: Date;
}

export type AttentionItem =
  | { type: "election_no_votes"; electionId: string; title: string; endDate: Date }
  | { type: "stale_pending_payment"; paymentId: string; reference: string; createdAt: Date };

export interface DashboardResponse {
  overview: DashboardOverview;
  revenue: DashboardRevenue;
  votingActivity: Array<{ date: string; votes: number }>;
  activeElections: DashboardActiveElection[];
  topNominees: DashboardTopNominee[];
  upcomingElections: DashboardUpcomingElection[];
  endingSoon: DashboardEndingSoon[];
  attentionItems: AttentionItem[];
}

// ── Organizer-scoped dashboard ─────────────────────────────────────
// Deliberately a narrower shape than DashboardResponse, not a filtered
// copy of it. An organizer should not see platform-wide payment health
// (stale pending payments), other organizers' elections, or upcoming
// elections they don't own — so those sections are absent entirely
// rather than present-but-empty.

export interface OrganizerDashboardOverview {
  totalElections: number;
  totalCategories: number;
  totalNominees: number;
  totalVotes: number;
  totalRevenue: string;
  // Count of the organizer's own elections in each status — drives the
  // "election status breakdown" widget without the frontend having to
  // fetch the full election list and count client-side.
  electionsByStatus: Record<ElectionStatus, number>;
}

export interface OrganizerDashboardElection {
  id: string;
  title: string;
  slug: string;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  pricePerVote: string;
  totalVotes: number;
  totalRevenue: string;
  // Null when the election has already ended or isn't active yet —
  // computed server-side so every client shows the same number rather
  // than each doing its own timezone-sensitive date math.
  daysRemaining: number | null;
}

export interface OrganizerDashboardResponse {
  overview: OrganizerDashboardOverview;
  revenue: {
    total: string;
    period: Array<{ date: string; amount: string }>;
  };
  votingActivity: Array<{ date: string; votes: number }>;
  elections: OrganizerDashboardElection[];
  topNominees: DashboardTopNominee[];
}