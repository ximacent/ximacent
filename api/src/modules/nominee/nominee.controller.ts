import { NomineeService } from "./nominee.service";
import type { CreateNomineeDTO, UpdateNomineeDTO, FilterNomineeDTO } from "@/types/nominee.type";
import type { ImageFileInput } from "@/lib/storage/createWithImages";

export class NomineeController {
  static async getNominees(filters: FilterNomineeDTO) {
    return await NomineeService.getNominees(filters);
  }

  static async getNominee(id: string) {
    return await NomineeService.getNominee(id);
  }

  static async createNominee(data: CreateNomineeDTO, image?: ImageFileInput) {
    return await NomineeService.create(data, image);
  }

  static async updateNominee(id: string, data: UpdateNomineeDTO, image?: ImageFileInput) {
    return await NomineeService.update(id, data, image);
  }

  static async deleteNominees(ids: string[]) {
    return await NomineeService.delete(ids);
  }
}