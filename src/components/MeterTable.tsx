import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  ChevronRight,
  Filter,
} from "lucide-react";
import type { Meter, Reading, Anomaly } from "../types/api";

export interface MeterWithMetrics extends Meter {
  current_consumption: number;
  baseline_consumption: number;
  variation_pct: number;
  anomaly?: Anomaly;
}

interface MeterTableProps {
  meters: Meter[];
  readings: Reading[];
  anomalies: Anomaly[];
  isLoading: boolean;
  onSelectMeter: (meterId: string) => void;
}

type SortField = "meter_id" | "consumption" | "variation" | "severity";
type SortOrder = "asc" | "desc";
type StatusFilter = "ALL" | "OK" | "Alert" | "Critical";

export const MeterTable: React.FC<MeterTableProps> = ({
  meters,
  readings,
  anomalies,
  isLoading,
  onSelectMeter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("severity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Enriquecer medidores con sus últimas lecturas, baseline y anomalías
  const enrichedMeters: MeterWithMetrics[] = useMemo(() => {
    return meters.map((meter) => {
      const meterReadings = readings.filter(
        (r) => r.meter_id === meter.meter_id,
      );

      const sortedReadings = [...meterReadings].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      const latestReading = sortedReadings[0]?.consumption_kwh || 0;

      const totalKwh = sortedReadings.reduce(
        (sum, r) => sum + r.consumption_kwh,
        0,
      );
      const baseline =
        sortedReadings.length > 0
          ? totalKwh / sortedReadings.length
          : latestReading;

      const variationPct =
        baseline > 0 ? ((latestReading - baseline) / baseline) * 100 : 0;

      const anomaly = anomalies.find((a) => a.meter_id === meter.meter_id);

      return {
        ...meter,
        current_consumption: latestReading,
        baseline_consumption: baseline,
        variation_pct: variationPct,
        anomaly,
      };
    });
  }, [meters, readings, anomalies]);

  const filteredMeters = useMemo(() => {
    return enrichedMeters.filter((meter) => {
      const matchesSearch =
        meter.meter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meter.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || meter.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrichedMeters, searchTerm, statusFilter]);

  // Aplicar Ordenamiento
  const sortedMeters = useMemo(() => {
    return [...filteredMeters].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case "meter_id":
          valA = a.meter_id;
          valB = b.meter_id;
          break;
        case "consumption":
          valA = a.current_consumption;
          valB = b.current_consumption;
          break;
        case "variation":
          valA = a.variation_pct;
          valB = b.variation_pct;
          break;
        case "severity": {
          const severityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1, undefined: 0 };
          valA =
            severityWeight[a.anomaly?.severity as keyof typeof severityWeight] ||
            0;
          valB =
            severityWeight[b.anomaly?.severity as keyof typeof severityWeight] ||
            0;
          break;
        }
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredMeters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
      {/* Cabecera y Barra de Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Gestión y Monitoreo de Medidores
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
              {sortedMeters.length} activos
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estado operativo, variaciones respecto a la línea base y severidad
            dictaminada por la IA.
          </p>
        </div>

        {/* Buscador y Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar meter_id u ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Filtros de Estado */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1 hidden sm:block" />
            {(["ALL", "OK", "Alert", "Critical"] as StatusFilter[]).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === st
                      ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st === "ALL"
                    ? "Todos"
                    : st === "OK"
                      ? "Normales"
                      : st === "Alert"
                        ? "Alertas"
                        : "Críticos"}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Medidores */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
            <tr>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("meter_id")}
              >
                <div className="flex items-center gap-1">
                  Medidor <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("consumption")}
              >
                <div className="flex items-center gap-1">
                  Consumo <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("variation")}
              >
                <div className="flex items-center gap-1">
                  Variación % <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Estado Operativo</th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort("severity")}
              >
                <div className="flex items-center gap-1">
                  Anomalía IA <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {sortedMeters.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  No se encontraron medidores coincidentes con los filtros
                  seleccionados.
                </td>
              </tr>
            ) : (
              sortedMeters.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => onSelectMeter(m.meter_id)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* ID Medidor */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500/80"></span>
                    {m.meter_id}
                    <span className="text-[10px] text-slate-500 font-sans font-normal ml-1">
                      ({m.location})
                    </span>
                  </td>

                  {/* Consumo */}
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {m.current_consumption.toLocaleString("es-CO")} kWh
                  </td>

                  {/* Variación */}
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md ${
                        m.variation_pct > 20
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : m.variation_pct < -10
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {m.variation_pct >= 0
                        ? `+${m.variation_pct.toFixed(1)}%`
                        : `${m.variation_pct.toFixed(1)}%`}
                    </span>
                  </td>

                  {/* Estado Operativo */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        m.status === "OK"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : m.status === "Alert"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {m.status === "OK" && <CheckCircle className="w-3 h-3" />}
                      {m.status === "Alert" && (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {m.status === "Critical" && (
                        <ShieldAlert className="w-3 h-3" />
                      )}
                      {m.status}
                    </span>
                  </td>

                  {/* Severidad IA */}
                  <td className="py-3.5 px-4 font-medium">
                    {m.anomaly ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                          m.anomaly.severity === "HIGH"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : m.anomaly.severity === "MEDIUM"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {m.anomaly.severity} Priority
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </td>

                  {/* Botón Ver Diagnóstico */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMeter(m.meter_id);
                      }}
                      className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-medium px-3 py-1.5 rounded-lg transition-all text-[11px]"
                    >
                      Diagnóstico
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
