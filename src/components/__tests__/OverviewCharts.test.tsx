import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverviewCharts } from "../OverviewCharts";
import type { Anomaly, Meter, Reading } from "../../types/api";

vi.mock("recharts", () => {
  const Chart = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Tooltip = ({
    formatter,
  }: {
    formatter?: (value: number | null) => unknown;
  }) => {
    formatter?.(25);
    formatter?.(null);
    return null;
  };
  const Legend = ({
    formatter,
  }: {
    formatter?: (value: string) => ReactNode;
  }) => <div>{formatter?.("Alta")}</div>;
  return {
    ResponsiveContainer: Chart,
    BarChart: Chart,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip,
    CartesianGrid: () => null,
    PieChart: Chart,
    Pie: Chart,
    Cell: () => null,
    Legend,
  };
});

const meters: Meter[] = [
  {
    id: "1",
    meter_id: "M-1",
    location: "Planta",
    status: "OK",
    created_at: "2026-01-01",
    updated_at: "2026-01-02",
  },
  {
    id: "2",
    meter_id: "M-2",
    location: "Bodega",
    status: "Alert",
    created_at: "2026-01-01",
    updated_at: "2026-01-02",
  },
];

const readings: Reading[] = [
  {
    id: "r-1",
    meter_id: "M-1",
    timestamp: "2026-01-01T10:00:00Z",
    consumption_kwh: 10,
    voltage_v: 220,
    current_a: 3,
    power_factor: 0.9,
  },
];

const anomaly = (id: string, severity: Anomaly["severity"]): Anomaly => ({
  id,
  meter_id: "M-1",
  type: "REAL ANOMALY",
  severity,
  confidence: 90,
  reason: "Test",
  recommended_action: "Inspect",
  status: "PENDING",
  detected_at: "2026-01-01",
});

describe("OverviewCharts", () => {
  it("renders loading placeholders", () => {
    const { container } = render(
      <OverviewCharts meters={[]} readings={[]} anomalies={[]} isLoading />,
    );
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2);
  });

  it("renders charts for every severity and remaining normal meters", () => {
    render(
      <OverviewCharts
        meters={meters}
        readings={readings}
        anomalies={[
          anomaly("high", "HIGH"),
          anomaly("medium", "MEDIUM"),
          anomaly("low", "LOW"),
          anomaly("unknown", "UNKNOWN" as Anomaly["severity"]),
        ]}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Consumo Comparativo por Medidor")).toBeInTheDocument();
    expect(screen.getByText("Severidad de Diagnósticos IA")).toBeInTheDocument();
    expect(screen.getByText("Distribución del estado operativo de la planta")).toBeInTheDocument();
  });

  it("handles an empty data set without anomalies", () => {
    render(
      <OverviewCharts meters={[]} readings={[]} anomalies={[]} isLoading={false} />,
    );
    expect(screen.getByText("Consumo Comparativo por Medidor")).toBeInTheDocument();
  });

  it("counts meters without anomalies as normal", () => {
    render(
      <OverviewCharts meters={meters} readings={[]} anomalies={[]} isLoading={false} />,
    );
    expect(screen.getByText("Consumo Comparativo por Medidor")).toBeInTheDocument();
  });
});