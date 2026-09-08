import { ImageFileInput } from "@/lib/storage/createWithImages";
import { ElectionService } from "./election.service";
import type { CreateElectionDTO, UpdateElectionDTO, FilterElectionDTO, UpdateElectionStatusDTO, } from "@/types/election.type";

export class ElectionController {
  static async getElections(data: FilterElectionDTO) {
    return await ElectionService.getElections(data);
  }

  static async getElection(id: string) {
    return await ElectionService.getElection(id);
  }

  static async createElection(data: CreateElectionDTO, createdById: string) {
    return await ElectionService.create(data, createdById);
  }

  static async updateElection(id: string, data: UpdateElectionDTO) {
    return await ElectionService.update(id, data);
  }

  static async updateElectionStatus(id: string, data: UpdateElectionStatusDTO) {
    return await ElectionService.updateStatus(id, data);
  }

  static async updateElectionBanner(id: string, image: ImageFileInput) {
    return await ElectionService.updateBanner(id, image);
  }

  static async deleteElections(ids: string[]) {
    return await ElectionService.delete(ids);
  }
}