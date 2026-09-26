import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiCards } from "../KpiCards";
import type { DashboardSummary } from "../../types/api";

const createSummary = (
  timestamp: string | null,
  status = "completed",
): DashboardSummary => ({
  kpis: {
    meters_count: 12,
    total_period_consumption_kwh: 1234.5,
    ai_anomalies_detected: 3,
    high_priority_anomalies: 1,
    ai_confidence_avg_pct: 96,
    last_analysis: { timestamp, status },
  },
  meters_by_status: {},
  anomalies_by_severity: {},
});

describe("KpiCards", () => {
  it("renders loading placeholders when loading or missing summary", () => {
    const { rerender, container } = render(
      <KpiCards summary={createSummary(null)} isLoading />,
    );
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6);

    rerender(<KpiCards summary={null} isLoading={false} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6);
  });

  it.each([
    ["completed", "text-emerald-400"],
    ["failed", "text-rose-400"],
    ["processing", "text-amber-400"],
    ["unknown", "text-slate-300"],
  ])("shows %s analysis status with its matching color", (status, color) => {
    const { container } = render(
      <KpiCards summary={createSummary("2026-09-26T15:30:00Z", status)} isLoading={false} />,
    );

    expect(screen.getByText(status)).toHaveClass(color);
    expect(screen.getByText("Medidores")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("96%")).toBeInTheDocument();
    expect(container.textContent).toContain("hora Colombia, UTC-5");
  });

  it.each([
    [null, "", "Sin análisis", "No hay fecha registrada", "Sin estado"],
    ["not-a-date", "", "Sin análisis", "No hay fecha registrada", "Sin estado"],
  ])("handles missing or invalid analysis dates", (timestamp, status, dateText, timeText, statusText) => {
    render(
      <KpiCards
        summary={createSummary(timestamp, status)}
        isLoading={false}
      />,
    );

    expect(screen.getByText(dateText)).toBeInTheDocument();
    expect(screen.getByText(timeText)).toBeInTheDocument();
    expect(screen.getByText(statusText)).toBeInTheDocument();
  });
});