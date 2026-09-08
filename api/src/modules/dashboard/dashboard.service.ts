import { AppDataSource } from "@/database/data-source";
import { Election, ElectionStatus } from "@/database/entities/Election";
import { Category } from "@/database/entities/Category";
import { Nominee } from "@/database/entities/Nominee";
import { Vote } from "@/database/entities/Vote";
import { Payment, PaymentStatus } from "@/database/entities/Payment";
import { PublicService } from "@/modules/public/public.service";
import type {
  DashboardResponse,
  DashboardOverview,
  DashboardRevenue,
  DashboardActiveElection,
  DashboardTopNominee,
  AttentionItem,
} from "@/types/dashboard.type";

const TREND_WINDOW_DAYS = 30;
const ENDING_SOON_HOURS = 48;
const ATTENTION_ENDING_SOON_HOURS = 24;
const STALE_PENDING_PAYMENT_HOURS = 1;
const TOP_NOMINEES_LIMIT = 10;
const PREVIEW_LIMIT = 5;

export class DashboardService {
  static async getDashboard(): Promise<DashboardResponse> {
    const db = await AppDataSource();

    // All independent aggregates run in parallel — none depend on another's
    // result, so there's no reason to serialize them.
    const [
      overview,
      revenue,
      votingActivity,
      activeElections,
      topNominees,
      upcomingElections,
      endingSoon,
      attentionItems,
    ] = await Promise.all([
      this.getOverview(),
      this.getRevenue(),
      this.getVotingActivity(),
      this.getActiveElectionsPerformance(),
      this.getTopNominees(),
      this.getUpcomingElections(),
      this.getEndingSoon(),
      this.getAttentionItems(),
    ]);

    return {
      overview,
      revenue,
      votingActivity,
      activeElections,
      topNominees,
      upcomingElections,
      endingSoon,
      attentionItems,
    };
  }

  private static async getOverview(): Promise<DashboardOverview> {
    const db = await AppDataSource();
    const electionRepo = db.getRepository(Election);
    const categoryRepo = db.getRepository(Category);
    const nomineeRepo = db.getRepository(Nominee);
    const voteRepo = db.getRepository(Vote);
    const paymentRepo = db.getRepository(Payment);

    const [
      totalElections,
      activeElections,
      totalCategories,
      totalNominees,
      votesResult,
      revenueResult,
    ] = await Promise.all([
      electionRepo.count({ where: { isDeleted: false } }),
      electionRepo.count({ where: { isDeleted: false, status: ElectionStatus.ACTIVE } }),
      categoryRepo.count({ where: { isDeleted: false } }),
      nomineeRepo.count({ where: { isDeleted: false } }),
      voteRepo
        .createQueryBuilder("vote")
        .select("COALESCE(SUM(vote.quantity), 0)", "total")
        .where("vote.isDeleted = false")
        .getRawOne<{ total: string }>(),
      paymentRepo
        .createQueryBuilder("payment")
        .select("COALESCE(SUM(payment.amount), 0)", "total")
        .where("payment.status = :status", { status: PaymentStatus.SUCCESS })
        .andWhere("payment.isDeleted = false")
        .getRawOne<{ total: string }>(),
    ]);

    return {
      totalElections,
      activeElections,
      totalCategories,
      totalNominees,
      totalVotes: parseInt(votesResult?.total ?? "0", 10),
      totalRevenue: parseFloat(revenueResult?.total ?? "0").toFixed(2),
    };
  }

  private static async getRevenue(): Promise<DashboardRevenue> {
    const db = await AppDataSource();
    const paymentRepo = db.getRepository(Payment);

    const [totalResult, successfulPayments, pendingPayments, failedPayments, periodRaw] =
      await Promise.all([
        paymentRepo
          .createQueryBuilder("payment")
          .select("COALESCE(SUM(payment.amount), 0)", "total")
          .where("payment.status = :status", { status: PaymentStatus.SUCCESS })
          .andWhere("payment.isDeleted = false")
          .getRawOne<{ total: string }>(),
        paymentRepo.count({ where: { status: PaymentStatus.SUCCESS, isDeleted: false } }),
        paymentRepo.count({ where: { status: PaymentStatus.PENDING, isDeleted: false } }),
        paymentRepo.count({ where: { status: PaymentStatus.FAILED, isDeleted: false } }),
        // Payment.updatedAt reflects the moment confirmByReference flips status
        // to SUCCESS (row-locked, Paystack-verified) — a reliable proxy for
        // "when this revenue was earned" without needing a dedicated column.
        paymentRepo
          .createQueryBuilder("payment")
          .select("DATE(payment.updatedAt)", "date")
          .addSelect("SUM(payment.amount)", "amount")
          .where("payment.status = :status", { status: PaymentStatus.SUCCESS })
          .andWhere("payment.isDeleted = false")
          .andWhere("payment.updatedAt >= NOW() - INTERVAL '30 days'")
          .groupBy("DATE(payment.updatedAt)")
          .orderBy("DATE(payment.updatedAt)", "ASC")
          .getRawMany<{ date: string; amount: string }>(),
      ]);

    return {
      total: parseFloat(totalResult?.total ?? "0").toFixed(2),
      successfulPayments,
      pendingPayments,
      failedPayments,
      period: periodRaw.map((r) => ({
        date: r.date,
        amount: parseFloat(r.amount).toFixed(2),
      })),
    };
  }

  private static async getVotingActivity(): Promise<Array<{ date: string; votes: number }>> {
    const db = await AppDataSource();
    const voteRepo = db.getRepository(Vote);

    const raw = await voteRepo
      .createQueryBuilder("vote")
      .select("DATE(vote.createdAt)", "date")
      .addSelect("SUM(vote.quantity)", "votes")
      .where("vote.isDeleted = false")
      .andWhere("vote.createdAt >= NOW() - INTERVAL '30 days'")
      .groupBy("DATE(vote.createdAt)")
      .orderBy("DATE(vote.createdAt)", "ASC")
      .getRawMany<{ date: string; votes: string }>();

    // Sparse series — only days with at least one vote are returned. The
    // frontend zero-fills gaps for chart rendering; keeping this endpoint
    // from doing 30 rows of bookkeeping for empty days is cheaper and simpler.
    return raw.map((r) => ({ date: r.date, votes: parseInt(r.votes, 10) }));
  }

  private static async getActiveElectionsPerformance(): Promise<DashboardActiveElection[]> {
    const db = await AppDataSource();

    // Vote totals: direct FK, no joins needed — this is exactly the payoff
    // of Vote.electionId being denormalized rather than derived through
    // category/nominee.
    const voteTotals = await db
      .getRepository(Vote)
      .createQueryBuilder("vote")
      .select("vote.election_id", "electionId")
      .addSelect("SUM(vote.quantity)", "totalVotes")
      .where("vote.isDeleted = false")
      .groupBy("vote.election_id")
      .getRawMany<{ electionId: string; totalVotes: string }>();

    // Revenue per election: Payment only has a direct nominee FK, so this
    // needs a join through nominee -> category -> election. Bounded by
    // successful-payment volume, not full table size — a single grouped
    // query, not N+1.
    const revenueTotals = await db
      .getRepository(Payment)
      .createQueryBuilder("payment")
      .innerJoin("payment.nominee", "nominee")
      .innerJoin("nominee.category", "category")
      .innerJoin("category.election", "election")
      .select("election.id", "electionId")
      .addSelect("SUM(payment.amount)", "totalRevenue")
      .where("payment.status = :status", { status: PaymentStatus.SUCCESS })
      .andWhere("payment.isDeleted = false")
      .groupBy("election.id")
      .getRawMany<{ electionId: string; totalRevenue: string }>();

    const voteMap = new Map(voteTotals.map((v) => [v.electionId, parseInt(v.totalVotes, 10)]));
    const revenueMap = new Map(
      revenueTotals.map((r) => [r.electionId, parseFloat(r.totalRevenue).toFixed(2)])
    );

    const activeElections = await db.getRepository(Election).find({
      where: { status: ElectionStatus.ACTIVE, isDeleted: false },
      select: { id: true, title: true, slug: true, endDate: true },
      order: { endDate: "ASC" },
    });

    return activeElections
      .map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        endDate: e.endDate,
        totalVotes: voteMap.get(e.id) ?? 0,
        totalRevenue: revenueMap.get(e.id) ?? "0.00",
      }))
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, PREVIEW_LIMIT);
  }

  private static async getTopNominees(): Promise<DashboardTopNominee[]> {
    const db = await AppDataSource();

    const raw = await db
      .getRepository(Vote)
      .createQueryBuilder("vote")
      .innerJoin("vote.nominee", "nominee")
      .innerJoin("nominee.category", "category")
      .innerJoin("category.election", "election")
      .select("nominee.id", "id")
      .addSelect("nominee.name", "name")
      .addSelect("nominee.code", "code")
      .addSelect("nominee.imageUrl", "imageUrl")
      .addSelect("category.id", "categoryId")
      .addSelect("category.name", "categoryName")
      .addSelect("election.id", "electionId")
      .addSelect("election.title", "electionTitle")
      .addSelect("SUM(vote.quantity)", "totalVotes")
      .where("vote.isDeleted = false")
      .andWhere("nominee.isDeleted = false")
      .groupBy("nominee.id")
      .addGroupBy("category.id")
      .addGroupBy("election.id")
      .orderBy("totalVotes", "DESC")
      .limit(TOP_NOMINEES_LIMIT)
      .getRawMany();

    return raw.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      imageUrl: r.imageUrl,
      totalVotes: parseInt(r.totalVotes, 10),
      category: { id: r.categoryId, name: r.categoryName },
      election: { id: r.electionId, title: r.electionTitle },
    }));
  }

  private static async getUpcomingElections() {
    // Reuses the existing public service rather than duplicating its query —
    // same "upcoming" definition the public site already uses.
    const { elections } = await PublicService.getUpcomingElections({ page: 1, limit: PREVIEW_LIMIT });
    return elections.map((e) => ({ id: e.id, title: e.title, slug: e.slug, startDate: e.startDate }));
  }

  private static async getEndingSoon() {
    const db = await AppDataSource();
    const elections = await db.getRepository(Election).find({
      where: { status: ElectionStatus.ACTIVE, isDeleted: false },
      select: { id: true, title: true, slug: true, endDate: true },
      order: { endDate: "ASC" },
      take: PREVIEW_LIMIT,
    });

    const cutoff = new Date(Date.now() + ENDING_SOON_HOURS * 60 * 60 * 1000);
    return elections
      .filter((e) => e.endDate <= cutoff)
      .map((e) => ({ id: e.id, title: e.title, slug: e.slug, endDate: e.endDate }));
  }

  private static async getAttentionItems(): Promise<AttentionItem[]> {
    const db = await AppDataSource();

    const attentionCutoff = new Date(Date.now() + ATTENTION_ENDING_SOON_HOURS * 60 * 60 * 1000);

    // Rule 1: active elections ending soon with zero votes — a left join
    // with a null check, not a full N+1 per election.
    const noVoteElections = await db
    .getRepository(Election)
    .createQueryBuilder("election")
    .leftJoin("votes", "vote", 'vote.election_id = election.id AND vote."isDeleted" = false')
    .select("election.id", "id")
    .addSelect("election.title", "title")
    .addSelect("election.endDate", "endDate")
    .where("election.status = :status", { status: ElectionStatus.ACTIVE })
    .andWhere("election.isDeleted = false")
    .andWhere("election.endDate <= :cutoff", { cutoff: attentionCutoff })
    .groupBy("election.id")
    .having("COUNT(vote.id) = 0")
    .getRawMany<{ id: string; title: string; endDate: Date }>();

    // Rule 2: payments stuck pending for over an hour — likely abandoned
    // checkouts, worth admin visibility even though no action is required.
    const staleCutoff = new Date(Date.now() - STALE_PENDING_PAYMENT_HOURS * 60 * 60 * 1000);
    const stalePayments = await db.getRepository(Payment).find({
      where: { status: PaymentStatus.PENDING, isDeleted: false },
      select: { id: true, providerReference: true, createdAt: true },
      order: { createdAt: "ASC" },
      take: PREVIEW_LIMIT,
    });
    const stalePendingFiltered = stalePayments.filter((p) => p.createdAt <= staleCutoff);

    const items: AttentionItem[] = [
      ...noVoteElections.map((e) => ({
        type: "election_no_votes" as const,
        electionId: e.id,
        title: e.title,
        endDate: e.endDate,
      })),
      ...stalePendingFiltered.map((p) => ({
        type: "stale_pending_payment" as const,
        paymentId: p.id,
        reference: p.providerReference,
        createdAt: p.createdAt,
      })),
    ];

    return items;
  }
}