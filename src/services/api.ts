import axios from "axios";
import type { Anomaly, DashboardSummary, Meter, Reading } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const EnergyService = {
  // Medidores
  getMeters: async (): Promise<Meter[]> => {
    const response = await api.get<Meter[]>("/meters");
    return response.data;
  },

  getMeterById: async (meterId: string): Promise<Meter> => {
    const response = await api.get<Meter>(`/meters/${meterId}`);
    return response.data;
  },

  getMeterReadings: async (meterId: string): Promise<Reading[]> => {
    const response = await api.get<Reading[]>(`/meters/${meterId}/readings`);
    return response.data;
  },

  // Anomalías
  getAnomalies: async (): Promise<Anomaly[]> => {
    const response = await api.get<Anomaly[]>("/anomalies");
    return response.data;
  },

  getAnomaliesByMeterId: async (meterId: string): Promise<Anomaly[]> => {
    const response = await api.get<Anomaly[]>(`/anomalies/${meterId}`);
    return response.data;
  },

  // AI Analysis
  triggerAiAnalysis: async (): Promise<{
    message: string;
    anomalies: Anomaly[];
  }> => {
    const response = await api.post<{ message: string; anomalies: Anomaly[] }>(
      "/ai/analyze",
    );
    return response.data;
  },

  async getAiAnalysisByMeterId(
    meterId: string,
    forceRefresh = false,
  ): Promise<Anomaly> {
    const url = forceRefresh
      ? `/ai/analysis/${meterId}?force=true`
      : `/ai/analysis/${meterId}`;

    const response = await api.get<Anomaly>(url);
    return response.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>("/dashboard/summary");
    return response.data;
  },
};
