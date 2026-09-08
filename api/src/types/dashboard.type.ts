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