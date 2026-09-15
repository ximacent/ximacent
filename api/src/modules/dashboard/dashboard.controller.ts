import { DashboardService } from "./dashboard.service";

export class DashboardController {
  static async getDashboard() {
    return await DashboardService.getDashboard();
  }

  static async getOrganizerDashboard(organizerId: string) {
    return await DashboardService.getOrganizerDashboard(organizerId);
  }
}