import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Row = {
  label: string;
  value: number;
};

type ApiResponse = {
  labels: string[];
  values: number[];
  name: string;
  metric: string;
};

export default function Graph() {
  const [data, setData] = useState<Row[] | null>(null);

  const fetchData = async () => {
    const res = await fetch(
      "http://localhost:8000/api/bar?name=Lebron&metric=REB"
    );
    const json: ApiResponse = await res.json();

    const rows: Row[] = json.labels.map((label, i) => ({
      label,
      value: json.values[i],
    }));

    setData(rows);
  };

  return (
    <div>
      <button onClick={fetchData}>Load Bar Chart</button>

      {!data ? (
        <p style={{ marginTop: 20 }}>Click to load chart.</p>
      ) : (
        <div style={{ height: 420, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}