import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, PieChart as PieIcon } from "lucide-react";
import type { Meter, Reading, Anomaly } from "../types/api";

interface OverviewChartsProps {
  meters: Meter[];
  readings: Reading[];
  anomalies: Anomaly[];
  isLoading: boolean;
}

const SEVERITY_COLORS = {
  HIGH: "#f43f5e",
  MEDIUM: "#f59e0b",
  LOW: "#3b82f6",
  OK: "#10b981",
};

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  meters,
  readings,
  anomalies,
  isLoading,
}) => {
  const barChartData = useMemo(() => {
    return meters.map((meter) => {
      const meterReadings = readings.filter(
        (r) => r.meter_id === meter.meter_id,
      );

      const totalKwh = meterReadings.reduce(
        (sum, r) => sum + r.consumption_kwh,
        0,
      );
      const avgKwh =
        meterReadings.length > 0 ? totalKwh / meterReadings.length : 0;

      return {
        meter_id: meter.meter_id,
        kwh: Number(avgKwh.toFixed(2)),
      };
    });
  }, [meters, readings]);

  const pieChartData = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    anomalies.forEach((a) => {
      if (a.severity === "HIGH") high++;
      else if (a.severity === "MEDIUM") medium++;
      else if (a.severity === "LOW") low++;
    });

    const totalAnomalies = high + medium + low;
    const okCount = Math.max(0, meters.length - totalAnomalies);

    return [
      { name: "Alta", value: high, color: SEVERITY_COLORS.HIGH },
      { name: "Media", value: medium, color: SEVERITY_COLORS.MEDIUM },
      { name: "Baja", value: low, color: SEVERITY_COLORS.LOW },
      { name: "Sin Anomalía", value: okCount, color: SEVERITY_COLORS.OK },
    ].filter((item) => item.value > 0);
  }, [anomalies, meters]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-72 animate-pulse"></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-72 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Gráfico 1: Consumo Comparativo por Medidor */}
      <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Consumo Comparativo por Medidor
              </h3>
              <p className="text-xs text-slate-400">
                Carga eléctrica registrada en el último ciclo (kWh)
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="meter_id" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                formatter={(value) => [
                  `${Number(value ?? 0).toLocaleString()} kWh`,
                  "Consumo",
                ]}
              />
              <Bar
                dataKey="kwh"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                name="Consumo (kWh)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Distribución de Severidad por IA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Severidad de Diagnósticos IA
              </h3>
              <p className="text-xs text-slate-400">
                Distribución del estado operativo de la planta
              </p>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-slate-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
