import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Row = {
  date: string;
  points: number;
  rolling: number;
};

type GraphProps = {
  data: Row[] | null;
  onOpenGraph: () => void;
};

export default function Graph({ data, onOpenGraph }: GraphProps) {
    return (
    <>
    
          <button onClick={onOpenGraph}>Open Graph</button>
    
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
        </>
    );
    
}