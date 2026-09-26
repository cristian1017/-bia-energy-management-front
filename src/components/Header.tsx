import React from "react";
import { Activity, RefreshCw, Zap } from "lucide-react";

interface HeaderProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onAnalyze,
  isAnalyzing,
  lastUpdated,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 shadow-inner flex items-center justify-center">
            <Zap className="w-6 h-6 fill-emerald-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Bia Energy
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
              Prueba técnica Sistema de Gestión de energia & Diagnóstico IA
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end md:self-auto">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Última actualización: {lastUpdated}
            </span>
          )}

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-lg
              ${
                isAnalyzing
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95"
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Analizando con IA...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Ejecutar Análisis IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
