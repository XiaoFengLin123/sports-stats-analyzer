import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell, 
  ReferenceLine
} from "recharts";
type Metric = "PTS" | "REB" | "AST" | "BLK" | "STL" | "TO";

type Row = {
  date: string; 
  opp: string; 
  value: number
};

type ApiResponse = { 
    name: string; 
    metric: string; 
    rows: Row[] };

type PlayersResponse = { players: string[] };

const METRICS: Metric[] = ["PTS", "REB", "AST", "BLK", "STL", "TO"];

export default function Graph() {
  const [metric, setMetric] = useState<Metric>("PTS");
  const [playerInput, setPlayerInput] = useState("LeBron James");
  const [player, setPlayer] = useState("LeBron James"); 

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);

  const [betLine, setBetLine] = useState<number>(25.5);

  const [window, setWindow] = useState<number>(0);

  const [data, setData] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredData = useMemo(() => {
  if (!data) return [];
  if (window === 0) return data;
  return data.slice(-window); // Grabs the last N elements
}, [data, window]);

// IMPORTANT: Update your 'stats' useMemo to use 'filteredData' instead of 'data'
const stats = useMemo(() => {
  if (!filteredData || filteredData.length === 0) return { overCount: 0, percentage: 0 };
  const overCount = filteredData.filter(row => row.value > betLine).length;
  const percentage = (overCount / filteredData.length) * 100;
  return { overCount, percentage };
}, [filteredData, betLine]);
  
  // small debounce so you don't spam backend
  useEffect(() => {
  let isMounted = true; // Prevents state updates on unmounted components
  const q = playerInput.trim();

  // If input is empty or exactly matches the current player, reset and exit
  if (!q || q === player) {
    setSuggestions([]);
    setShowSug(false);
    return;
  }

    const handle = setTimeout(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/players?q=${encodeURIComponent(q)}`);
      if (!isMounted) return;

      const json: PlayersResponse = await res.json();
      
      // The "?. " ensures that if json or players is missing, it won't crash the page
      const playerList = json?.players || [];
      setSuggestions(playerList);
      setShowSug(playerList.length > 0);
    } catch (err) {
      console.error("Search fetch failed:", err);
      if (isMounted) {
        setSuggestions([]);
        setShowSug(false);
      }
    }
  }, 300);

  return () => {
    isMounted = false;
    clearTimeout(handle);
  };
}, [playerInput, player]);


  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8000/api/bar?name=${encodeURIComponent(
        player
      )}&metric=${metric}`;
      const res = await fetch(url);
      const json: ApiResponse = await res.json();
      if (!res.ok || (json as any).error) throw new Error((json as any).error || `HTTP ${res.status}`);
      setData(json.rows);
    } catch (e: any) {
      setData(null);
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // auto-load whenever player or metric changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, metric]);

  const onPickSuggestion = (name: string) => {
  setPlayer(name);     
  setPlayerInput(name); 
  setSuggestions([]);   
  setShowSug(false);    
};

  return (
    <div>
      {/* Header row: title + search box */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
  <label style={{ fontSize: 12, color: "#666" }}>Betting Line</label>
  <input
    type="number"
    step="0.5"
    value={betLine}
    onChange={(e) => setBetLine(parseFloat(e.target.value) || 0)}
    style={{
      padding: "8px",
      borderRadius: 10,
      border: "1px solid #ccc",
      width: 80,
    }}
  />
</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

        <div style={{ position: "relative" }}>
          <input
           value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onFocus={() => setShowSug(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSug(false), 120)}
            // ADD THIS BLOCK BELOW
            onKeyDown={(e) => {
            if (e.key === "Enter") {
            setPlayer(playerInput); // This updates the "Selected" state
            setShowSug(false);      // Closes the dropdown
            }
        }}
            
            placeholder="Search player..."
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ccc",
              width: 220,
            }}
          />

          {/* Suggestions dropdown */}
          {showSug && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                zIndex: 10,
              }}
            >
              {suggestions.map((s) => (
                <div
                  key={s}
                  onMouseDown={() => onPickSuggestion(s)} // prevents blur from killing click
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optional: show what is selected */}
        <div style={{ fontSize: 14, color: "#555" }}>
          Selected: <b>{player}</b>
        </div>
      </div>

      {/* Metric buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
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
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
  {[0, 5, 10, 20].map((num) => (
    <button
      key={num}
      onClick={() => setWindow(num)}
      style={{
        padding: "6px 12px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        background: window === num ? "#111" : "#fff",
        color: window === num ? "#fff" : "#111",
        cursor: "pointer",
        fontSize: "12px"
      }}
    >
      {num === 0 ? "2025" : `Last ${num}`}
    </button>
  ))}
</div>  
      {loading && <p style={{ marginTop: 12 }}>Loading {player} {metric}...</p>}
      {error && <p style={{ marginTop: 12, color: "crimson" }}>Error: {error}</p>}
      
      {!loading && !error && data && (
        <div style={{ height: 420, marginTop: 20 }}>
            <div style={{ 
  marginTop: 20, 
  padding: '15px', 
  borderRadius: '12px', 
  background: stats.percentage > 50 ? '#f0fdf4' : '#fef2f2', // Green if mostly overs, Red if mostly unders
  border: `1px solid ${stats.percentage > 50 ? '#22c55e' : '#ef4444'}`
}}>
  <h3 style={{ margin: 0, fontSize: '18px' }}>
    Chance of Over: <span style={{ color: stats.percentage > 50 ? '#22c55e' : '#ef4444' }}>
      {stats.percentage.toFixed(1)}%
    </span>
  </h3>
  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
    Cleared {betLine} in {stats.overCount} of {data?.length} games
  </p>
</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip
    labelFormatter={(_, payload) => {
      const row = payload?.[0]?.payload as Row | undefined;
      return row ? `${row.date} vs ${row.opp}` : "";
    }}
    formatter={(v) => [v, metric]}
  />
  
  {/* The Reference Line shows the betting threshold */}
  <ReferenceLine 
    y={betLine} 
    stroke="#666" 
    strokeDasharray="3 3" 
    label={{ value: `Line: ${betLine}`, fill: '#666', position: 'right' }} 
  />

  {/* Mapping through data to color each Bar individually */}
  <Bar dataKey="value">
    {data.map((entry, index) => (
      <Cell 
        key={`cell-${index}`} 
        // If the value is LOWER than the line, it's RED (The Under)
        // If the value is HIGHER, it's GREEN (The Over)
        fill={entry.value < betLine ? "#ef4444" : "#22c55e"} 
      />
    ))}
  </Bar>
</BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}