import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MeterTable } from "../MeterTable";
import type { Anomaly, Meter, Reading } from "../../types/api";

const meters: Meter[] = [
  { id: "1", meter_id: "M-1", location: "Planta Norte", status: "OK", created_at: "2026-01-01", updated_at: "2026-01-02" },
  { id: "2", meter_id: "M-2", location: "Bodega", status: "Alert", created_at: "2026-01-01", updated_at: "2026-01-02" },
  { id: "3", meter_id: "M-3", location: "Taller", status: "Critical", created_at: "2026-01-01", updated_at: "2026-01-02" },
  { id: "4", meter_id: "M-4", location: "Planta Sur", status: "OK", created_at: "2026-01-01", updated_at: "2026-01-02" },
  { id: "5", meter_id: "M-5", location: "Patio", status: "Alert", created_at: "2026-01-01", updated_at: "2026-01-02" },
  { id: "6", meter_id: "M-6", location: "Taller Sur", status: "OK", created_at: "2026-01-01", updated_at: "2026-01-02" },
];

const readings: Reading[] = [
  { id: "r1", meter_id: "M-1", timestamp: "2026-01-01T10:00:00Z", consumption_kwh: 1, voltage_v: 220, current_a: 2, power_factor: 0.9 },
  { id: "r2", meter_id: "M-1", timestamp: "2026-01-02T10:00:00Z", consumption_kwh: 3, voltage_v: 221, current_a: 3, power_factor: 0.9 },
  { id: "r3", meter_id: "M-2", timestamp: "2026-01-02T10:00:00Z", consumption_kwh: 10, voltage_v: 220, current_a: 4, power_factor: 0.9 },
  { id: "r4", meter_id: "M-3", timestamp: "2026-01-02T10:00:00Z", consumption_kwh: 5, voltage_v: 220, current_a: 5, power_factor: 0.9 },
  { id: "r5", meter_id: "M-5", timestamp: "2026-01-01T10:00:00Z", consumption_kwh: 10, voltage_v: 220, current_a: 5, power_factor: 0.9 },
  { id: "r6", meter_id: "M-5", timestamp: "2026-01-02T10:00:00Z", consumption_kwh: 0, voltage_v: 220, current_a: 5, power_factor: 0.9 },
];

const makeAnomaly = (meterId: string, severity: Anomaly["severity"]): Anomaly => ({
  id: `${meterId}-anomaly`,
  meter_id: meterId,
  type: "REAL ANOMALY",
  severity,
  confidence: 90,
  reason: "Test reason",
  recommended_action: "Inspect meter",
  status: "PENDING",
  detected_at: "2026-01-02",
});

const anomalies = [
  makeAnomaly("M-1", "HIGH"),
  makeAnomaly("M-2", "MEDIUM"),
  makeAnomaly("M-3", "LOW"),
  makeAnomaly("M-4", "LOW"),
];

const renderTable = (onSelectMeter = vi.fn()) =>
  render(
    <MeterTable
      meters={meters}
      readings={readings}
      anomalies={anomalies}
      isLoading={false}
      onSelectMeter={onSelectMeter}
    />,
  );

const getMeterIds = () =>
  screen.getAllByRole("row").slice(1).map((row) => row.textContent?.match(/M-\d/)?.[0]);

describe("MeterTable", () => {
  it("renders the loading state", () => {
    const { container } = render(
      <MeterTable meters={[]} readings={[]} anomalies={[]} isLoading onSelectMeter={vi.fn()} />,
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows metrics, operational statuses, anomaly priorities, and selection actions", async () => {
    const user = userEvent.setup();
    const onSelectMeter = vi.fn();
    renderTable(onSelectMeter);

    expect(screen.getByText("+50.0%")).toBeInTheDocument();
    expect(screen.getAllByText("+0.0%")).toHaveLength(4);
    expect(screen.getByText("-100.0%")).toBeInTheDocument();
    expect(screen.getByText("HIGH Priority")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM Priority")).toBeInTheDocument();
    expect(screen.getAllByText("LOW Priority")).toHaveLength(2);
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.getByText("Critical")).toBeInTheDocument();

    const diagnosticButtons = screen.getAllByRole("button", { name: /Diagnóstico/ });
    await user.click(diagnosticButtons[0]);
    expect(onSelectMeter).toHaveBeenCalledExactlyOnceWith("M-1");

    await user.click(screen.getByText("M-2"));
    expect(onSelectMeter).toHaveBeenLastCalledWith("M-2");
  });

  it("searches by id or location and applies each status filter", async () => {
    const user = userEvent.setup();
    renderTable();
    const search = screen.getByPlaceholderText("Buscar meter_id u ubicación...");

    await user.type(search, "m-3");
    expect(getMeterIds()).toEqual(["M-3"]);
    await user.clear(search);
    await user.type(search, "bodega");
    expect(getMeterIds()).toEqual(["M-2"]);
    await user.clear(search);

    await user.click(screen.getByRole("button", { name: "Normales" }));
    expect(getMeterIds()).toEqual(["M-1", "M-4", "M-6"]);
    await user.click(screen.getByRole("button", { name: "Alertas" }));
    expect(getMeterIds()).toEqual(["M-2", "M-5"]);
    await user.click(screen.getByRole("button", { name: "Críticos" }));
    expect(getMeterIds()).toEqual(["M-3"]);
    await user.click(screen.getByRole("button", { name: "Todos" }));
    await user.type(search, "missing");
    expect(screen.getByText(/No se encontraron medidores/)).toBeInTheDocument();
  });

  it("sorts meter id, consumption, variation, and severity in both directions", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByText("Medidor"));
    expect(getMeterIds()).toEqual(["M-6", "M-5", "M-4", "M-3", "M-2", "M-1"]);
    await user.click(screen.getByText("Medidor"));
    expect(getMeterIds()).toEqual(["M-1", "M-2", "M-3", "M-4", "M-5", "M-6"]);
    await user.click(screen.getByText("Medidor"));
    expect(getMeterIds()[0]).toBe("M-6");

    await user.click(screen.getByText("Consumo"));
    expect(getMeterIds()[0]).toBe("M-2");
    await user.click(screen.getByText("Consumo"));
    expect(getMeterIds()[0]).toBe("M-4");

    await user.click(screen.getByText("Variación %"));
    expect(getMeterIds()[0]).toBe("M-1");
    await user.click(screen.getByText("Variación %"));
    expect(getMeterIds()[0]).toBe("M-5");

    await user.click(screen.getByText("Anomalía IA"));
    expect(getMeterIds()[0]).toBe("M-1");
    await user.click(screen.getByText("Anomalía IA"));
    expect(getMeterIds()[0]).toBe("M-5");

    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(7);
  });
});