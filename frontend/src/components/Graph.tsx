import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
type Metric = "PTS" | "REB" | "AST" | "BLK" | "STL" | "PF" | "TO";

type Row = {
  date: string; 
  opp: string; 
  value: number
};

type ApiResponse = { 
    name: string; 
    metric: string; 
    rows: Row[] };

const METRICS: Metric[] = ["PTS", "REB", "AST", "BLK", "STL", "PF", "TO"];

export default function Graph() {
  const [metric, setMetric] = useState<Metric>("PTS");
  const [data, setData] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8000/api/bar?name=Lebron&metric=${metric}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      if ((json as any).error) throw new Error((json as any).error);
      setData(json.rows);
    } catch (e: any) {
      setData(null);
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on first render and whenever metric changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric]);

  return (
    <div>
      {/* Metric buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {METRICS.map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            disabled={loading && metric === m}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ccc",
              background: m === metric ? "#111" : "#fff",
              color: m === metric ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {loading && <p style={{ marginTop: 12 }}>Loading {metric}...</p>}
      {error && (
        <p style={{ marginTop: 12, color: "crimson" }}>Error: {error}</p>
      )}

      {!loading && !error && data && (
        <div style={{ height: 420, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as Row | undefined;
                  return row ? `${row.date} vs ${row.opp}` : "";
                }}
                formatter={(v) => [v, metric]}
              />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && !data && (
        <p style={{ marginTop: 12 }}>No data loaded.</p>
      )}
    </div>
  );
}