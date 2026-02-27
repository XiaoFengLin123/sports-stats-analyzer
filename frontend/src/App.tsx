import { useState } from "react";
import Graph from "./components/Graph";

interface ApiResponse {
  dates: string[];
  values: number[];
  rolling: number[];
}

type Row = {
  date: string;
  points: number;
  rolling: number;
};

export default function App() {
  const [data, setData] = useState<Row[] | null>(null);

  const fetchData = async () => {
    const res = await fetch("http://localhost:8000/api/stats");
    const json: ApiResponse = await res.json();

    const rows: Row[] = json.dates.map((d, i) => ({
      date: d,
      points: json.values[i],
      rolling: json.rolling[i],
    }));

    setData(rows);
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Sports Analyzer</h1>
      <Graph data={data} onOpenGraph={fetchData} />
    </div>
  );
}