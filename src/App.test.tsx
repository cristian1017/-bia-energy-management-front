import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Anomaly, DashboardSummary, Meter, Reading } from "./types/api";

const energyMocks = vi.hoisted(() => ({
  getDashboardSummary: vi.fn(),
  getMeters: vi.fn(),
  getAnomalies: vi.fn(),
  getMeterReadings: vi.fn(),
  triggerAiAnalysis: vi.fn(),
}));

vi.mock("./services/api", () => ({ EnergyService: energyMocks }));

vi.mock("./components/Header", () => ({
  Header: ({ onAnalyze, isAnalyzing }: { onAnalyze: () => void; isAnalyzing: boolean }) => (
    <button onClick={onAnalyze} disabled={isAnalyzing}>
      {isAnalyzing ? "analyzing" : "analyze"}
    </button>
  ),
}));

vi.mock("./components/KpiCards", () => ({
  KpiCards: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="kpi-state">{isLoading ? "loading" : "ready"}</div>
  ),
}));

vi.mock("./components/OverviewCharts", () => ({
  OverviewCharts: () => <div data-testid="overview" />,
}));

vi.mock("./components/MeterTable", () => ({
  MeterTable: ({ meters, onSelectMeter }: { meters: Meter[]; onSelectMeter: (id: string) => void }) => (
    <button onClick={() => onSelectMeter(meters[0]?.meter_id ?? "")}>select meter</button>
  ),
}));

vi.mock("./components/MeterModal", () => ({
  MeterModal: ({ meterId, onClose }: { meterId: string | null; onClose: () => void }) => (
    <div>
      <span data-testid="selected-meter">{meterId ?? "none"}</span>
      <button onClick={onClose}>close meter</button>
    </div>
  ),
}));

const summary: DashboardSummary = {
  kpis: {
    meters_count: 1,
    total_period_consumption_kwh: 30,
    ai_anomalies_detected: 0,
    high_priority_anomalies: 0,
    ai_confidence_avg_pct: 0,
    last_analysis: { timestamp: null, status: "" },
  },
  meters_by_status: {},
  anomalies_by_severity: {},
};

const meter: Meter = {
  id: "meter-1",
  meter_id: "M-1",
  location: "Plant",
  status: "OK",
  created_at: "2026-01-01",
  updated_at: "2026-01-02",
};

const reading: Reading = {
  id: "reading-1",
  meter_id: "M-1",
  timestamp: "2026-01-01T10:00:00Z",
  consumption_kwh: 30,
  voltage_v: 220,
  current_a: 3,
  power_factor: 0.9,
};

const anomaly: Anomaly = {
  id: "anomaly-1",
  meter_id: "M-1",
  type: "REAL ANOMALY",
  severity: "LOW",
  confidence: 80,
  reason: "Test",
  recommended_action: "Inspect",
  status: "PENDING",
  detected_at: "2026-01-02",
};

const setSuccessfulResponses = () => {
  energyMocks.getDashboardSummary.mockResolvedValue(summary);
  energyMocks.getMeters.mockResolvedValue([meter]);
  energyMocks.getAnomalies.mockResolvedValue([anomaly]);
  energyMocks.getMeterReadings.mockResolvedValue([reading]);
  energyMocks.triggerAiAnalysis.mockResolvedValue({ message: "done", anomalies: [] });
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSuccessfulResponses();
  });

  it("loads dashboard data and selects or closes a meter", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByTestId("kpi-state")).toHaveTextContent("ready");
    expect(energyMocks.getDashboardSummary).toHaveBeenCalledOnce();
    expect(energyMocks.getMeters).toHaveBeenCalledOnce();
    expect(energyMocks.getAnomalies).toHaveBeenCalledOnce();
    expect(energyMocks.getMeterReadings).toHaveBeenCalledWith("M-1");

    await user.click(screen.getByRole("button", { name: "select meter" }));
    expect(screen.getByTestId("selected-meter")).toHaveTextContent("M-1");
    await user.click(screen.getByRole("button", { name: "close meter" }));
    expect(screen.getByTestId("selected-meter")).toHaveTextContent("none");
  });

  it("runs AI analysis, reloads the dashboard, and resets its loading state", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("kpi-state");

    await user.click(screen.getByRole("button", { name: "analyze" }));
    await waitFor(() => expect(energyMocks.getDashboardSummary).toHaveBeenCalledTimes(2));
    expect(energyMocks.triggerAiAnalysis).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "analyze" })).toBeEnabled();
  });

  it("handles initial dashboard errors and clears the loading state", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    energyMocks.getDashboardSummary.mockRejectedValue(new Error("offline"));
    render(<App />);

    await waitFor(() => expect(screen.getByTestId("kpi-state")).toHaveTextContent("ready"));
    expect(consoleError).toHaveBeenCalledWith("Error cargando datos iniciales:", expect.any(Error));
  });

  it("handles analysis and reload errors and always resets analysis state", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    energyMocks.triggerAiAnalysis.mockRejectedValue(new Error("analysis failed"));
    render(<App />);
    await screen.findByTestId("kpi-state");

    await user.click(screen.getByRole("button", { name: "analyze" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "analyze" })).toBeEnabled());
    expect(consoleError).toHaveBeenCalledWith("Error ejecutando análisis de IA:", expect.any(Error));

    energyMocks.triggerAiAnalysis.mockResolvedValue({ message: "done", anomalies: [] });
    energyMocks.getDashboardSummary.mockRejectedValueOnce(new Error("reload failed"));
    await user.click(screen.getByRole("button", { name: "analyze" }));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith("Error cargando datos del dashboard:", expect.any(Error)));
  });

  it("does not update state when unmounted before the initial summary resolves", async () => {
    let resolveSummary!: (value: DashboardSummary) => void;
    energyMocks.getDashboardSummary.mockReturnValueOnce(
      new Promise<DashboardSummary>((resolve) => {
        resolveSummary = resolve;
      }),
    );
    const { unmount } = render(<App />);
    await waitFor(() => expect(energyMocks.getDashboardSummary).toHaveBeenCalledOnce());
    unmount();

    await act(async () => resolveSummary(summary));
    expect(energyMocks.getMeterReadings).not.toHaveBeenCalled();
  });

  it("does not update state when unmounted while readings are loading", async () => {
    let resolveReadings!: (value: Reading[]) => void;
    energyMocks.getMeterReadings.mockReturnValueOnce(
      new Promise<Reading[]>((resolve) => {
        resolveReadings = resolve;
      }),
    );
    const { unmount } = render(<App />);
    await waitFor(() => expect(energyMocks.getMeterReadings).toHaveBeenCalledOnce());
    unmount();

    await act(async () => resolveReadings([reading]));
    expect(energyMocks.getDashboardSummary).toHaveBeenCalledOnce();
  });
});