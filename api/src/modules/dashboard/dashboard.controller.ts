import { DashboardService } from "./dashboard.service";

export class DashboardController {
  static async getDashboard() {
    return await DashboardService.getDashboard();
  }
}