/** Shared API types matching ximacent-api-reference.md */

export type ElectionStatus = "draft" | "active" | "closed";
export type UserRole = "admin" | "voter";
export type PaymentStatus = "pending" | "success" | "failed";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  code: string;
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  code: string;
  label: string;
  key: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Election {
  id: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  title: string;
  alias: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  pricePerVote: string;
  status: ElectionStatus;
  bannerUrl: string | null;
  createdBy?: UserSummary;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  election?: Pick<Election, "id" | "title">;
}

export interface Nominee {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  code: string;
  category?: Pick<Category, "id" | "name">;
}

/** Nested shapes expected from GET /public/elections/:idOrSlug */
export interface PublicNominee {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  code: string;
}

export interface NomineeByCodeResult extends PublicNominee {
  category: { id: string; name: string };
  election: {
    id: string;
    title: string;
    slug: string;
    status: ElectionStatus;
    pricePerVote: string;
  };
}

export interface PublicCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  nominees: PublicNominee[];
}

export interface PublicElectionDetail extends Election {
  categories: PublicCategory[];
}

/** Response shape from GET /public/categories/:id */
export interface PublicCategoryDetail {
  id: string;
  name: string;
  description: string | null;
  election: Pick<Election, "id" | "title" | "slug" | "status" | "pricePerVote" | "bannerUrl">;
  nominees: PublicNominee[];
}

export interface CategoryResults {
  category: Pick<Category, "id" | "name">;
  nominees: Array<{
    nomineeId: string;
    name: string;
    code: string;
    imageUrl: string | null;
    totalVotes: number;
  }>;
  totalVotes: number;
}

export interface ElectionResults {
  election: Pick<Election, "id" | "title" | "status">;
  categories: CategoryResults[];
  totalVotes: number;
}

export interface NomineeVotes {
  nomineeId: string;
  name: string;
  totalVotes: number;
}

export interface CreatePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  paymentId: string;
  amount: string;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  reference: string;
  amount?: string;
  quantity?: number;
}

export interface LoginResponse {
  user: UserSummary;
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly label?: string;
  readonly key?: string;

  constructor(
    message: string,
    status: number,
    meta?: Pick<ApiErrorEnvelope, "code" | "label" | "key">
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = meta?.code;
    this.label = meta?.label;
    this.key = meta?.key;
  }
}
