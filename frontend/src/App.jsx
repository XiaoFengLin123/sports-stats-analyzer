import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function App() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await fetch("http://localhost:8000/api/stats");
    const json = await res.json();

    const rows = json.dates.map((d, i) => ({
      date: d,
      points: json.values[i],
      rolling: json.rolling[i],
    }));

    setData(rows);
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Sports Analyzer</h1>

      <button onClick={fetchData}>Open Graph</button>

      {!data ? (
        <p style={{ marginTop: 20 }}>
          Click "Open Graph" to render the chart.
        </p>
      ) : (
        <div style={{ height: 400, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="points" />
              <Line type="monotone" dataKey="rolling" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}