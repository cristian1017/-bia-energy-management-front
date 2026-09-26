import React from 'react';
import { Gauge, Zap, AlertTriangle, ShieldAlert, Cpu, CalendarClock } from 'lucide-react';
import type { DashboardSummary } from '../types/api';

interface KpiCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl animate-pulse h-32 flex flex-col justify-between"
          >
            <div className="h-4 bg-slate-800 rounded w-2/3"></div>
            <div className="h-8 bg-slate-800 rounded w-1/2"></div>
            <div className="h-3 bg-slate-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const { kpis } = summary;
  const analysisDate = kpis.last_analysis.timestamp
    ? new Date(kpis.last_analysis.timestamp)
    : null;
  const hasValidAnalysisDate = analysisDate && !Number.isNaN(analysisDate.getTime());
  const analysisStatus = kpis.last_analysis.status || 'Sin estado';
  const normalizedAnalysisStatus = analysisStatus.toLowerCase();
  const analysisStatusColor = ['completed', 'complete', 'success', 'successful', 'completado', 'completada'].includes(normalizedAnalysisStatus)
    ? 'text-emerald-400'
    : ['failed', 'error', 'fallido', 'fallida'].includes(normalizedAnalysisStatus)
      ? 'text-rose-400'
      : ['running', 'processing', 'pending', 'en progreso', 'pendiente'].includes(normalizedAnalysisStatus)
        ? 'text-amber-400'
        : 'text-slate-300';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {/* 1. Medidores Totales */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Medidores
          </span>
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-100 tracking-tight">
          {kpis.meters_count}
        </div>
      </div>

      {/* 2. Consumo Total del Periodo */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Consumo Total
          </span>
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-100 tracking-tight">
          {kpis.total_period_consumption_kwh.toLocaleString('es-CO')}
          <span className="text-sm font-medium text-slate-400 ml-1">kWh</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Acumulado del periodo</p>
      </div>

      {/* 3. Anomalías Detectadas por IA */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Anomalías IA
          </span>
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-purple-400 tracking-tight">
          {kpis.ai_anomalies_detected}
          <span className="text-xs font-normal text-slate-400 ml-2">detectadas</span>
        </div>
      </div>

      {/* 4. Alta Prioridad */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-rose-900/50 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Alta Prioridad
          </span>
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-rose-500 tracking-tight">
          {kpis.high_priority_anomalies}
        </div>
        <p className="text-xs text-rose-400/80 mt-2 font-medium">
          Requieren intervención
        </p>
      </div>

      {/* 5. Confianza de la IA (Métrica Agregada) */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-900/50 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Confianza IA
          </span>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-black text-emerald-400 tracking-tight">
          {kpis.ai_confidence_avg_pct}%
        </div>
      </div>

      {/* 6. Último análisis */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Último análisis
          </span>
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <CalendarClock className="w-5 h-5" />
          </div>
        </div>
        <div className="text-lg font-bold text-slate-100">
          {hasValidAnalysisDate
            ? analysisDate.toLocaleDateString('es-CO', {
              timeZone: 'America/Bogota',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'Sin análisis'}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {hasValidAnalysisDate
            ? analysisDate.toLocaleTimeString('es-CO', {
                timeZone: 'America/Bogota',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'No hay fecha registrada'}
          {hasValidAnalysisDate && ' (hora Colombia, UTC-5)'}
        </p>
        <p className="text-xs mt-2">
          Estado: <span className={`font-semibold ${analysisStatusColor}`}>{analysisStatus}</span>
        </p>
      </div>
    </div>
  );
};