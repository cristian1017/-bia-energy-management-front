import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MeterModal } from "../MeterModal";
import type { Anomaly, Meter, Reading } from "../../types/api";

const energyMocks = vi.hoisted(() => ({
  getMeterById: vi.fn(),
  getAnomaliesByMeterId: vi.fn(),
  getAiAnalysisByMeterId: vi.fn(),
}));

vi.mock("../../services/api", () => ({ EnergyService: energyMocks }));

vi.mock("recharts", () => {
  const Chart = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Chart,
    AreaChart: Chart,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    CartesianGrid: () => null,
  };
});

const meter: Meter = {
  id: "meter-1",
  meter_id: "M-1",
  location: "Subestación Norte",
  status: "OK",
  created_at: "2026-01-01",
  updated_at: "2026-01-02",
};

const makeReading = (
  id: string,
  timestamp: string,
  consumption_kwh: number,
  voltage_v = 230,
  current_a = 8,
  power_factor = 0.9,
): Reading => ({
  id,
  meter_id: "M-1",
  timestamp,
  consumption_kwh,
  voltage_v,
  current_a,
  power_factor,
});

const readings = [
  makeReading("r1", "2026-01-01T10:00:00Z", 10),
  makeReading("r2", "2026-01-01T11:00:00Z", 30, 260, 8, 0.7),
];

const makeAnomaly = (
  severity: Anomaly["severity"],
  reason = "Voltage outside expected range",
  confidence = 85,
): Anomaly => ({
  id: `anomaly-${severity}`,
  meter_id: "M-1",
  type: "REAL ANOMALY",
  severity,
  confidence,
  reason,
  recommended_action: "Inspect the installation",
  status: "PENDING",
  detected_at: "2026-01-02",
});

describe("MeterModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    energyMocks.getMeterById.mockResolvedValue(meter);
    energyMocks.getAnomaliesByMeterId.mockResolvedValue([]);
    energyMocks.getAiAnalysisByMeterId.mockResolvedValue(makeAnomaly("HIGH"));
  });

  it("renders nothing without a selected meter", () => {
    const { container } = render(
      <MeterModal meterId={null} onClose={vi.fn()} readings={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(energyMocks.getMeterById).not.toHaveBeenCalled();
  });

  it("shows telemetry, meter details, normal status, and each history metric", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MeterModal meterId="M-1" onClose={onClose} readings={readings} />);

    expect(await screen.findByText("(Subestación Norte)")).toBeInTheDocument();
    expect(screen.getByText("30.00")).toBeInTheDocument();
    expect(screen.getByText("20.00")).toBeInTheDocument();
    expect(screen.getByText("+50.0%")).toBeInTheDocument();
    expect(screen.getByText("260")).toBeInTheDocument();
    expect(screen.getByText("0.7")).toBeInTheDocument();
    expect(screen.getByText(/Operación Normal/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltaje" }));
    expect(screen.getByText("Histórico de Voltaje (V)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Corriente" }));
    expect(screen.getByText("Histórico de Corriente (A)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Factor de Potencia" }));
    expect(screen.getByText("Histórico del Factor de Potencia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Consumo" }));
    expect(screen.getByText("Histórico de Consumo (kWh)")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button")[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders anomaly reasoning, recommended action, and confidence", async () => {
    energyMocks.getAnomaliesByMeterId.mockResolvedValue([makeAnomaly("MEDIUM")]);
    render(<MeterModal meterId="M-1" onClose={vi.fn()} readings={[]} />);

    expect(await screen.findByText("MEDIUM SEVERITY")).toBeInTheDocument();
    expect(screen.getByText("Voltage outside expected range")).toBeInTheDocument();
    expect(screen.getByText("Inspect the installation")).toBeInTheDocument();
    expect(screen.getByText("Confianza: 85%")).toBeInTheDocument();
  });

  it("renders low-severity styling and normal voltage values", async () => {
    energyMocks.getAnomaliesByMeterId.mockResolvedValue([
      makeAnomaly("LOW", "Minor voltage deviation", 0),
    ]);
    render(
      <MeterModal
        meterId="M-1"
        onClose={vi.fn()}
        readings={[makeReading("r1", "2026-01-01T10:00:00Z", 10, 220, 4, 0.9)]}
      />,
    );

    expect(await screen.findByText("LOW SEVERITY")).toBeInTheDocument();
    expect(screen.getByText("220")).toHaveClass("text-slate-100");
    expect(screen.queryByText("Confianza: 0%")).not.toBeInTheDocument();
  });

  it("re-evaluates the meter and displays the returned AI anomaly", async () => {
    const user = userEvent.setup();
    const aiAnomaly = makeAnomaly("HIGH", "AI detected an overload", 0);
    energyMocks.getAnomaliesByMeterId.mockResolvedValue([makeAnomaly("LOW")]);
    energyMocks.getAiAnalysisByMeterId.mockResolvedValue(aiAnomaly);
    render(<MeterModal meterId="M-1" onClose={vi.fn()} readings={[]} />);

    await user.click(screen.getByRole("button", { name: "Re-evaluar" }));
    expect(await screen.findByText("HIGH SEVERITY")).toBeInTheDocument();
    expect(screen.getByText("AI detected an overload")).toBeInTheDocument();
    expect(screen.queryByText("Confianza: 0%")).not.toBeInTheDocument();
    expect(energyMocks.getAiAnalysisByMeterId).toHaveBeenCalledWith("M-1");
  });

  it("shows the AI error when reevaluation fails", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    energyMocks.getAiAnalysisByMeterId.mockRejectedValue(new Error("offline"));
    render(<MeterModal meterId="M-1" onClose={vi.fn()} readings={[]} />);

    await user.click(screen.getByRole("button", { name: "Re-evaluar" }));
    expect(
      await screen.findByText("No se pudo obtener el diagnóstico automático de la IA."),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it("falls back safely when meter and anomaly endpoints reject", async () => {
    energyMocks.getMeterById.mockRejectedValue(new Error("meter unavailable"));
    energyMocks.getAnomaliesByMeterId.mockRejectedValue(new Error("anomalies unavailable"));
    render(<MeterModal meterId="M-1" onClose={vi.fn()} readings={[]} />);

    expect(await screen.findByText(/Operación Normal/)).toBeInTheDocument();
    expect(screen.queryByText("(Subestación Norte)")).not.toBeInTheDocument();
    expect(screen.queryByText("Consumo actual")).not.toBeInTheDocument();
  });

  it("handles a synchronous meter-load failure and an anomaly without a reason", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    energyMocks.getMeterById.mockImplementation(() => {
      throw new Error("unexpected");
    });
    energyMocks.getAnomaliesByMeterId.mockResolvedValue([makeAnomaly("LOW", "", 0)]);
    render(
      <MeterModal
        meterId="M-1"
        onClose={vi.fn()}
        readings={[
          makeReading("r1", "2026-01-01T10:00:00Z", 10),
          makeReading("r2", "2026-01-01T11:00:00Z", 0, 170, 4, 0.8),
        ]}
      />,
    );

    expect(await screen.findByText(/Operación Normal/)).toBeInTheDocument();
    expect(screen.getByText("0.00")).toBeInTheDocument();
    expect(screen.getByText("-100.0%")).toBeInTheDocument();
    expect(screen.getByText("170")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it("disables reevaluation while the AI request is pending", async () => {
    const user = userEvent.setup();
    let completeAnalysis: ((value: Anomaly) => void) | undefined;
    energyMocks.getAiAnalysisByMeterId.mockReturnValue(
      new Promise<Anomaly>((resolve) => {
        completeAnalysis = resolve;
      }),
    );
    render(<MeterModal meterId="M-1" onClose={vi.fn()} readings={[]} />);

    const button = screen.getByRole("button", { name: "Re-evaluar" });
    await user.click(button);
    expect(button).toBeDisabled();

    await act(async () => {
      completeAnalysis?.(makeAnomaly("HIGH"));
    });
    expect(await screen.findByText("HIGH SEVERITY")).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
});