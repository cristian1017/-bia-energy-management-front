export interface Meter {
  id: string;
  meter_id: string;
  location: string;
  status: 'OK' | 'Alert' | 'Critical';
  created_at: string;
  updated_at: string;
}

export interface Reading {
  id: string;
  meter_id: string;
  timestamp: string;
  consumption_kwh: number;
  voltage_v: number;
  current_a: number;
  power_factor: number;
}

export interface Anomaly {
  id: string;
  meter_id: string;
  type: 'REAL ANOMALY' | 'EXPLAINABLE ANOMALY' | 'FALSE POSITIVE' | 'DATA QUALITY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reason: string;
  recommended_action: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  detected_at: string;
}

export interface DashboardSummary {
  kpis: {
    meters_count: number;
    total_period_consumption_kwh: number;
    ai_anomalies_detected: number;
    high_priority_anomalies: number;
    ai_confidence_avg_pct: number;
    last_analysis: {
      timestamp: string | null;
      status: string;
    };
  };
  meters_by_status: Record<string, number>;
  anomalies_by_severity: Record<string, number>;
}