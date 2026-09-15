import { ImageFileInput } from "@/lib/storage/createWithImages";
import { ElectionService } from "./election.service";
import type { CreateElectionDTO, FilterElectionDTO, UpdateElectionStatusDTO, ElectionActor } from "@/types/election.type";

export class ElectionController {
  static async getElections(data: FilterElectionDTO) {
    return await ElectionService.getElections(data);
  }

  static async getElection(id: string) {
    return await ElectionService.getElection(id);
  }

  static async createElection(data: CreateElectionDTO, actor: ElectionActor) {
    return await ElectionService.create(data, actor);
  }

  static async updateElection(id: string, data: unknown, actor: ElectionActor) {
    return await ElectionService.update(id, data, actor);
  }

  static async updateElectionStatus(id: string, data: UpdateElectionStatusDTO, actor: ElectionActor) {
    return await ElectionService.updateStatus(id, data, actor);
  }

  static async overrideElectionStatus(id: string, adminId: string, newStatus: UpdateElectionStatusDTO["status"], reason: string) {
    return await ElectionService.overrideStatus(id, adminId, newStatus, reason);
  }

  static async updateElectionBanner(id: string, image: ImageFileInput) {
    return await ElectionService.updateBanner(id, image);
  }

  static async deleteElections(ids: string[]) {
    return await ElectionService.delete(ids);
  }
}