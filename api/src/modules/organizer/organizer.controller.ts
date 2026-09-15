import { OrganizerService } from "./organizer.service";
import { FilterOrganizerDTO, RejectOrganizerDTO } from "@/types/organizer.type";
import { PaginationQuery } from "@/types/pagination.type";
import type { ImageFileInput } from "@/lib/storage/createWithImages";
import type { OrganizerVerificationStatus } from "@/database/entities/OrganizerProfile";

export class OrganizerController {
  static async getMyProfile(userId: string) {
    return await OrganizerService.getMyProfile(userId);
  }

  static async updateMyProfile(userId: string, data: unknown, image?: ImageFileInput) {
    return await OrganizerService.updateMyProfile(userId, data, image);
  }

  static async uploadGhCardImage(userId: string, image: ImageFileInput) {
    return await OrganizerService.uploadGhCardImage(userId, image);
  }

  static async submitApplication(userId: string) {
    return await OrganizerService.submitApplication(userId);
  }

  static async getStatusSummary(userId: string) {
    return await OrganizerService.getStatusSummary(userId);
  }

  static async listForAdmin(filters: FilterOrganizerDTO & PaginationQuery) {
    return await OrganizerService.listForAdmin(filters);
  }

  static async getForAdmin(id: string) {
    return await OrganizerService.getForAdmin(id);
  }

  static async approve(id: string, adminId: string) {
    return await OrganizerService.approve(id, adminId);
  }

  static async reject(id: string, adminId: string, data: RejectOrganizerDTO) {
    return await OrganizerService.reject(id, adminId, data);
  }

  static async suspend(id: string, adminId: string) {
    return await OrganizerService.suspend(id, adminId);
  }

  static async overrideStatus(id: string, adminId: string, newStatus: OrganizerVerificationStatus, reason: string) {
    return await OrganizerService.overrideStatus(id, adminId, newStatus, reason);
  }
}
