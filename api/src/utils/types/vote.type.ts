import { VotingEventStatus } from "@/database/entities/VotingEvent";

// ==========================================
// Voting Event DTOs
// ==========================================

export type CreateVotingEventDTO = {
  title: string;
  description?: string;
  price: number;
  status?: VotingEventStatus;
  startTime?: string;
  endTime?: string;
  eventId: string;
};

export type UpdateVotingEventDTO = {
  title?: string;
  description?: string;
  price?: number;
  status?: VotingEventStatus;
  startTime?: string;
  endTime?: string;
  eventId?: string;
};

export type FilterVotingEventDTO = {
  title?: string;
  status?: VotingEventStatus;
  eventId?: string;
};

// ==========================================
// Vote Limit DTOs
// ==========================================

export type CreateVoteLimitDTO = {
  votingEventId: string;
  maxVotesPerUser: number;
  perDay?: number;
};

export type UpdateVoteLimitDTO = {
  maxVotesPerUser?: number;
  perDay?: number;
};

export type FilterVoteLimitDTO = {
  votingEventId?: string;
};

// ==========================================
// Voting Result DTOs
// ==========================================

export type CreateVotingResultDTO = {
  votingEventId: string;
  contestantId: string;
  totalVotes: number;
  rank?: number;
  publishedAt?: string;
};

export type UpdateVotingResultDTO = {
  totalVotes?: number;
  rank?: number;
  publishedAt?: string;
};

export type FilterVotingResultDTO = {
  votingEventId?: string;
  contestantId?: string;
  rank?: number;
};

// ==========================================
// Vote DTOs (for casting votes)
// ==========================================

export type CastVoteDTO = {
  votingEventId: string;
  contestantId: string;
};

export type FilterVoteDTO = {
  votingEventId?: string;
  contestantId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
};