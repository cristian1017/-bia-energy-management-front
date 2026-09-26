import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Anomaly, DashboardSummary, Meter, Reading } from "../../types/api";

const axiosMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("axios", () => ({
  default: { create: vi.fn(() => axiosMocks) },
}));

import { api, EnergyService } from "../api";

const meter = { meter_id: "M-1" } as Meter;
const reading = { meter_id: "M-1" } as Reading;
const anomaly = { meter_id: "M-1" } as Anomaly;
const summary = { kpis: {} } as DashboardSummary;

describe("EnergyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns meters and meter detail responses", async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: [meter] });
    expect(await EnergyService.getMeters()).toEqual([meter]);
    expect(api.get).toHaveBeenCalledWith("/meters");

    axiosMocks.get.mockResolvedValueOnce({ data: meter });
    expect(await EnergyService.getMeterById("M-1")).toEqual(meter);
    expect(api.get).toHaveBeenLastCalledWith("/meters/M-1");
  });

  it("returns meter readings and anomaly responses", async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: [reading] });
    expect(await EnergyService.getMeterReadings("M-1")).toEqual([reading]);
    expect(api.get).toHaveBeenLastCalledWith("/meters/M-1/readings");

    axiosMocks.get.mockResolvedValueOnce({ data: [anomaly] });
    expect(await EnergyService.getAnomalies()).toEqual([anomaly]);
    expect(api.get).toHaveBeenLastCalledWith("/anomalies");

    axiosMocks.get.mockResolvedValueOnce({ data: [anomaly] });
    expect(await EnergyService.getAnomaliesByMeterId("M-1")).toEqual([anomaly]);
    expect(api.get).toHaveBeenLastCalledWith("/anomalies/M-1");
  });

  it("triggers AI analysis and retrieves cached or refreshed results", async () => {
    const result = { message: "done", anomalies: [anomaly] };
    axiosMocks.post.mockResolvedValueOnce({ data: result });
    expect(await EnergyService.triggerAiAnalysis()).toEqual(result);
    expect(api.post).toHaveBeenCalledWith("/ai/analyze");

    axiosMocks.get.mockResolvedValueOnce({ data: anomaly });
    expect(await EnergyService.getAiAnalysisByMeterId("M-1")).toEqual(anomaly);
    expect(api.get).toHaveBeenLastCalledWith("/ai/analysis/M-1");

    axiosMocks.get.mockResolvedValueOnce({ data: anomaly });
    expect(await EnergyService.getAiAnalysisByMeterId("M-1", true)).toEqual(anomaly);
    expect(api.get).toHaveBeenLastCalledWith("/ai/analysis/M-1?force=true");
  });

  it("returns the dashboard summary", async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: summary });
    expect(await EnergyService.getDashboardSummary()).toEqual(summary);
    expect(api.get).toHaveBeenCalledWith("/dashboard/summary");
  });
});