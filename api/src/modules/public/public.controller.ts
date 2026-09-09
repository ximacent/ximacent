import { PublicService } from "./public.service";
import type { PaginationQuery } from "@/types/pagination.type";

export class PublicController {
  static async getActiveElections(query: PaginationQuery) {
    return await PublicService.getActiveElections(query);
  }

  static async getUpcomingElections(query: PaginationQuery) {
    return await PublicService.getUpcomingElections(query);
  }

  static async getElectionDetail(idOrSlug: string) {
    return await PublicService.getElectionDetail(idOrSlug);
  }

  static async getCategoryDetail(categoryId: string) {
    return await PublicService.getCategoryDetail(categoryId);
  }

  static async getNomineePublicProfile(id: string) {
    return await PublicService.getNomineePublicProfile(id);
  }

  static async getNomineeByCode(code: string) {
    return await PublicService.getNomineeByCode(code);
  }

}