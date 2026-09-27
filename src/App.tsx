import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { KpiCards } from "./components/KpiCards";
import { OverviewCharts } from "./components/OverviewCharts";
import { MeterTable } from "./components/MeterTable";
import { MeterModal } from "./components/MeterModal";
import { EnergyService } from "./services/api";
import type { DashboardSummary, Meter, Reading, Anomaly } from "./types/api";

export function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, metersRes, anomaliesRes] = await Promise.all([
        EnergyService.getDashboardSummary(),
        EnergyService.getMeters(),
        EnergyService.getAnomalies(),
      ]);

      setSummary(summaryRes);
      setMeters(metersRes);
      setAnomalies(anomaliesRes);

      const readingsPromises = metersRes.map((m) =>
        EnergyService.getMeterReadings(m.meter_id),
      );
      const readingsNested = await Promise.all(readingsPromises);
      setReadings(readingsNested.flat());
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await EnergyService.triggerAiAnalysis();
      await loadAllData();
    } catch (error) {
      console.error("Error ejecutando análisis de IA:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const initData = async () => {
      try {
        setIsLoading(true);
        const [summaryRes, metersRes, anomaliesRes] = await Promise.all([
          EnergyService.getDashboardSummary(),
          EnergyService.getMeters(),
          EnergyService.getAnomalies(),
        ]);

        if (!isActive) return;

        setSummary(summaryRes);
        setMeters(metersRes);
        setAnomalies(anomaliesRes);

        const readingsPromises = metersRes.map((m) =>
          EnergyService.getMeterReadings(m.meter_id),
        );
        const readingsNested = await Promise.all(readingsPromises);

        if (!isActive) return;

        setReadings(readingsNested.flat());
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void initData();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Header onAnalyze={handleRunAIAnalysis} isAnalyzing={isAnalyzing} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 1. Tarjetas KPI */}
        <KpiCards summary={summary} isLoading={isLoading} />

        {/* 2. Gráficos de Visión General */}
        <OverviewCharts
          meters={meters}
          readings={readings}
          anomalies={anomalies}
          isLoading={isLoading}
        />

        {/* 3. Tabla Interactiva de Medidores */}
        <MeterTable
          meters={meters}
          readings={readings}
          anomalies={anomalies}
          isLoading={isLoading}
          onSelectMeter={(meterId) => setSelectedMeterId(meterId)}
        />
      </main>

      {/* 4. Modal de Diagnóstico IA */}
      <MeterModal
        meterId={selectedMeterId}
        onClose={() => setSelectedMeterId(null)}
        onAnalysisComplete={loadAllData}
        readings={readings}
      />
    </div>
  );
}

export default App;
