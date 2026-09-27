import React, { useEffect, useState } from "react";
import {
  X,
  Zap,
  Activity,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { EnergyService } from "../services/api";
import type { Meter, Reading, Anomaly } from "../types/api";

const chartMetrics = {
  consumption: {
    dataKey: "consumption_kwh",
    label: "Histórico de Consumo (kWh)",
    color: "#10b981",
  },
  voltage: {
    dataKey: "voltage_v",
    label: "Histórico de Voltaje (V)",
    color: "#38bdf8",
  },
  current: {
    dataKey: "current_a",
    label: "Histórico de Corriente (A)",
    color: "#f59e0b",
  },
  powerFactor: {
    dataKey: "pf",
    label: "Histórico del Factor de Potencia",
    color: "#8b5cf6",
  },
} as const;

type ChartMetric = keyof typeof chartMetrics;

interface MeterModalProps {
  meterId: string | null;
  onClose: () => void;
  onAnalysisComplete?: () => void | Promise<void>;
  readings: Reading[];
}

export const MeterModal: React.FC<MeterModalProps> = ({
  meterId,
  onClose,
  onAnalysisComplete,
  readings,
}) => {
  const [meterDetail, setMeterDetail] = useState<Meter | null>(null);
  const [meterAnomaly, setMeterAnomaly] = useState<Anomaly | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Anomaly | null>(null);

  const [isLoadingMeter, setIsLoadingMeter] = useState<boolean>(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [errorAnalysis, setErrorAnalysis] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("consumption");

  // Lecturas específicas del medidor ordenadas por fecha
  const meterReadings = readings
    .filter((r) => r.meter_id === meterId)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  const latestReading = meterReadings[meterReadings.length - 1];
  const totalKwh = meterReadings.reduce((sum, r) => sum + r.consumption_kwh, 0);
  const baselineKwh =
    meterReadings.length > 0 ? totalKwh / meterReadings.length : 0;

  const latestKwh = latestReading?.consumption_kwh || 0;
  const variationPct =
    baselineKwh > 0 ? ((latestKwh - baselineKwh) / baselineKwh) * 100 : 0;

  const chartData = meterReadings.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    consumption_kwh: reading.consumption_kwh,
    voltage_v: reading.voltage_v,
    current_a: reading.current_a,
    pf: reading.power_factor,
  }));
  const activeChartMetric = chartMetrics[chartMetric];

  // Cargar datos del medidor y anomalías
  const loadMeterDetailsAndAnomalies = async (id: string) => {
    try {
      setIsLoadingMeter(true);

      const [detailRes, anomalyRes] = await Promise.allSettled([
        EnergyService.getMeterById(id),
        EnergyService.getAnomaliesByMeterId(id),
      ]);

      if (detailRes.status === "fulfilled") {
        setMeterDetail(detailRes.value);
      }

      if (anomalyRes.status === "fulfilled") {
        setMeterAnomaly(anomalyRes.value[0] ?? null);
      } else {
        setMeterAnomaly(null);
      }
    } catch (err) {
      console.error("Error cargando detalles del medidor:", err);
    } finally {
      setIsLoadingMeter(false);
    }
  };

  // Cargar análisis de IA
  const fetchAiAnalysis = async (id: string) => {
    try {
      setIsLoadingAnalysis(true);
      setErrorAnalysis(null);
      const data = await EnergyService.getAiAnalysisByMeterId(id, true);
      setAiAnalysis(data);
      if (data?.status != "OK") {
        await onAnalysisComplete?.();
      }
    } catch (err) {
      console.error("Error fetching AI analysis:", err);
      setErrorAnalysis(
        "No se pudo obtener el diagnóstico automático de la IA.",
      );
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (!meterId) {
      return;
    }

    const id = meterId;
    const timer = window.setTimeout(() => {
      void loadMeterDetailsAndAnomalies(id);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      setMeterDetail(null);
      setMeterAnomaly(null);
      setAiAnalysis(null);
      setErrorAnalysis(null);
      setChartMetric("consumption");
    };
  }, [meterId]);

  if (!meterId) return null;

  const activeAnomaly = aiAnalysis || meterAnomaly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Cabecera del Modal */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-100 font-mono">
                  {meterId}
                </h2>
                {meterDetail && (
                  <span className="text-xs text-slate-400">
                    ({meterDetail.location})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Diagnóstico Técnico e Historial de Consumo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 space-y-6">
          {/* Tarjetas de Telemetría Eléctrica */}
          {latestReading && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Consumo actual
                </span>
                <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                  {latestReading.consumption_kwh.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    kWh
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Baseline Apox.
                </span>
                <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                  {baselineKwh.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    kWh
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Variación
                </span>
                <div
                  className={`text-xl font-bold mt-1 font-mono ${
                    variationPct > 20
                      ? "text-rose-400"
                      : variationPct < -20
                        ? "text-blue-400"
                        : "text-emerald-400"
                  }`}
                >
                  {variationPct > 0
                    ? `+${variationPct.toFixed(1)}%`
                    : `${variationPct.toFixed(1)}%`}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Voltaje
                </span>
                <div
                  className={`text-xl font-bold mt-1 font-mono ${
                    latestReading.voltage_v < 180 ||
                    latestReading.voltage_v > 250
                      ? "text-rose-400"
                      : "text-slate-100"
                  }`}
                >
                  {latestReading.voltage_v}{" "}
                  <span className="text-xs font-normal text-slate-400">V</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Corriente
                </span>
                <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                  {latestReading.current_a}{" "}
                  <span className="text-xs font-normal text-slate-400">A</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Factor Potencia
                </span>
                <div
                  className={`text-xl font-bold mt-1 font-mono ${
                    latestReading.power_factor < 0.75
                      ? "text-amber-400"
                      : "text-slate-100"
                  }`}
                >
                  {latestReading.power_factor}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Evaluación de la IA
                </h3>
              </div>
              <button
                onClick={() => fetchAiAnalysis(meterId)}
                disabled={isLoadingAnalysis}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg transition-all"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLoadingAnalysis ? "animate-spin" : ""}`}
                />
                Re-evaluar
              </button>
            </div>

            {isLoadingAnalysis || isLoadingMeter ? (
              <div className="py-8 text-center text-slate-400 animate-pulse space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
                <p className="text-xs">
                  Consultando información detallada del medidor...
                </p>
              </div>
            ) : errorAnalysis ? (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {errorAnalysis}
              </p>
            ) : activeAnomaly && activeAnomaly.reason ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      activeAnomaly.severity === "HIGH"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : activeAnomaly.severity === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {activeAnomaly.severity} SEVERITY
                  </span>

                  <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono">
                    {activeAnomaly.type}
                  </span>

                  {activeAnomaly.confidence && (
                    <span className="bg-purple-500/10 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-500/20 font-medium ml-auto">
                      Confianza: {activeAnomaly.confidence}%
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">
                      Razonamiento Técnico:
                    </span>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                      {activeAnomaly.reason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase">
                      Acción Operativa Recomendada:
                    </span>
                    <p className="text-xs text-emerald-300 mt-0.5 font-medium">
                      {activeAnomaly.recommended_action}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-sm block text-emerald-300">
                    Operación Normal — Sin Anomalías
                  </span>
                  <p className="text-emerald-400/90 leading-relaxed">
                    Los parámetros eléctricos del medidor{" "}
                    <strong className="font-mono">{meterId}</strong> se
                    encuentran estables dentro de las tolerancias permitidas
                    (180V–250V, Factor de Potencia &gt; 0.75). No se detectaron
                    patrones anómalos en el consumo.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico Histórico */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  {activeChartMetric.label}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1"
                  role="group"
                  aria-label="Métrica del histórico"
                >
                  {(
                    [
                      ["consumption", "Consumo"],
                      ["voltage", "Voltaje"],
                      ["current", "Corriente"],
                      ["powerFactor", "Factor de Potencia"],
                    ] as const
                  ).map(([metric, label]) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setChartMetric(metric)}
                      aria-pressed={chartMetric === metric}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        chartMetric === metric
                          ? "bg-slate-700 text-slate-100"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Últimas lecturas
                </span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={activeChartMetric.color}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={activeChartMetric.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeChartMetric.dataKey}
                    stroke={activeChartMetric.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorKwh)"
                    name={activeChartMetric.label}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
