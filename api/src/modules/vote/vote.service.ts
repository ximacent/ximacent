import { validate as isUUID } from "uuid";
import { AppDataSource } from "@/database/data-source";
import { Nominee } from "@/database/entities/Nominee";
import { Category } from "@/database/entities/Category";
import { Election } from "@/database/entities/Election";
import { Vote } from "@/database/entities/Vote";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";

export class VoteService {
  /**
   * Leaderboard for a single category: every nominee in the category,
   * including those with zero votes so far, ordered by total votes desc.
   */
  static async getCategoryResults(categoryId: string) {
    if (!categoryId || !isUUID(categoryId)) {
      throw new CustomAppError( "Valid categoryId is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const db = await AppDataSource();

    const category = await db.getRepository(Category).findOne({ where: { id: categoryId, isDeleted: false } });
    if (!category) {
      throw new CustomAppError( "No category found with this categoryId", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "category_not_found" );
    }

    const raw = await db
      .getRepository(Nominee)
      .createQueryBuilder("nominee")
      .leftJoin("nominee.category", "category")
      .leftJoin("nominee.votes", "vote")
      .select("nominee.id", "nomineeId")
      .addSelect("nominee.name", "name")
      .addSelect("nominee.code", "code")
      .addSelect("nominee.imageUrl", "imageUrl")
      .addSelect("COALESCE(SUM(vote.quantity), 0)", "totalVotes")
      .where("category.id = :categoryId", { categoryId })
      .andWhere("nominee.isDeleted = false")
      .groupBy("nominee.id")
      .orderBy("totalVotes", "DESC")
      .addOrderBy("nominee.name", "ASC")
      .getRawMany();

    const nominees = raw.map((row) => ({
      nomineeId: row.nomineeId,
      name: row.name,
      code: row.code,
      imageUrl: row.imageUrl,
      totalVotes: parseInt(row.totalVotes, 10),
    }));

    const totalVotes = nominees.reduce((sum, n) => sum + n.totalVotes, 0);

    return {
      category: { id: category.id, name: category.name },
      nominees,
      totalVotes,
    };
  }

  /**
   * Full election results: every category's leaderboard, plus an
   * election-wide total. Reuses getCategoryResults per category rather
   * than a separate aggregate query — keeps a single source of truth
   * for "how do we compute a category's tally."
   */
  static async getElectionResults(electionId: string) {
    if (!electionId || !isUUID(electionId)) {
      throw new CustomAppError( "Valid electionId is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const db = await AppDataSource();

    const election = await db.getRepository(Election).findOne({
      where: { id: electionId, isDeleted: false },
      relations: { categories: true },
    });

    if (!election) {
      throw new CustomAppError( "No election found with this electionId", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    const activeCategories = election.categories.filter((c) => !c.isDeleted);

    const categories = await Promise.all(
      activeCategories.map((c) => this.getCategoryResults(c.id))
    );

    const totalVotes = categories.reduce((sum, c) => sum + c.totalVotes, 0);

    return {
      election: { id: election.id, title: election.title, status: election.status },
      categories,
      totalVotes,
    };
  }

  /** Single nominee's running total — useful for a nominee-specific page/widget. */
  static async getNomineeVotes(nomineeId: string) {
    if (!nomineeId || !isUUID(nomineeId)) {
      throw new CustomAppError( "Valid nomineeId is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const db = await AppDataSource();

    const nominee = await db.getRepository(Nominee).findOne({ where: { id: nomineeId, isDeleted: false } });
    if (!nominee) {
      throw new CustomAppError( "No nominee found with this nomineeId", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "nominee_not_found" );
    }

    const { total } = await db
      .getRepository(Vote)
      .createQueryBuilder("vote")
      .leftJoin("vote.nominee", "nominee")
      .select("COALESCE(SUM(vote.quantity), 0)", "total")
      .where("nominee.id = :nomineeId", { nomineeId })
      .getRawOne();

    return { nomineeId, name: nominee.name, totalVotes: parseInt(total, 10) };
  }
}