import {
  getLostByHour,
  getLostByLocation,
  getPlatformTotals,
  getReturnSuccessRate
} from "../models/analyticsModel";
import { AnalyticsSummary, AnalyticsTotals } from "../domain/entities";

export async function getAnalyticsSummary() {
  const [totals, returnSuccessRate, lostByLocation, lostByHour] = await Promise.all([
    getPlatformTotals(),
    getReturnSuccessRate(),
    getLostByLocation(),
    getLostByHour()
  ]);

  const summary = new AnalyticsSummary(
    AnalyticsTotals.fromDb(totals),
    returnSuccessRate,
    lostByLocation.map((entry) => ({
      location_name: String(entry.location_name),
      total: Number(entry.total)
    })),
    lostByHour.map((entry) => ({
      hour_of_day: Number(entry.hour_of_day),
      total: Number(entry.total)
    }))
  );

  return summary.toApiView();
}
