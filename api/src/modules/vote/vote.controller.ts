import { VoteService } from "./vote.service";

export class VoteController {
  static async getCategoryResults(categoryId: string) {
    return await VoteService.getCategoryResults(categoryId);
  }

  static async getElectionResults(electionId: string) {
    return await VoteService.getElectionResults(electionId);
  }

  static async getNomineeVotes(nomineeId: string) {
    return await VoteService.getNomineeVotes(nomineeId);
  }
}