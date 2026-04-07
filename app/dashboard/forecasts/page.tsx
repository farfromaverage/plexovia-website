"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Brain, TrendingUp, AlertTriangle } from "lucide-react";

type Forecast = {
  id: string;
  naics_code: string;
  agency_name: string;
  forecast_type: string;
  predicted_array: number[];
  confidence_score: number;
  insight_text: string;
};

export default function ForecastsPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForecasts() {
      try {
        const res = await fetch("/api/forecasts");
        if (!res.ok) throw new Error("Failed to fetch forecasts");
        const data = await res.json();
        setForecasts(data.forecasts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchForecasts();
  }, []);

  return (
    <>
      <style>{`
        .cc-header { border-bottom:1px solid #252320; background:#1C1917; position:sticky; top:0; z-index:50; height:60px; display:flex; align-items:center; padding:0 2rem; gap:1.5rem; }
        .cc-nav    { display:flex; gap:0.25rem; flex:1; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
        .cc-nav::-webkit-scrollbar { display:none; }
        .cc-nav-item { white-space:nowrap; }
        .cc-main   { max-width:1100px; margin:0 auto; padding:2rem; }
        @media (max-width: 768px) {
          .cc-header { padding: 0 1rem; }
          .cc-main   { padding: 1rem; }
        }
      `}</style>
      <div style={{ minHeight:"100vh", background:"#1C1917", fontFamily:"var(--font-inter), sans-serif" }}>
        
        <header className="cc-header">
          <Link href="/" style={{ textDecoration:"none", flexShrink:0 }}>
            <span style={{ fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.05em" }}>
              <span style={{ color:"#C9A84C" }}>P</span><span style={{ color:"#F7F5F0" }}>lexovia</span>
            </span>
          </Link>
          <nav className="cc-nav">
            {[
              { href:"/dashboard", label:"Overview" },
              { href:"/dashboard/contracts", label:"Contracts" },
              { href:"/dashboard/profile", label:"Profile" },
              { href:"/dashboard/competitors", label:"Competitors" },
              { href:"/dashboard/forecasts", label:"AI Forecasts", active:true },
              { href:"/dashboard/team", label:"Team" },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className="cc-nav-item"
                style={{ padding:"6px 12px", borderRadius:"8px", fontSize:"0.8125rem", textDecoration:"none",
                  color: n.active ? "#C9A84C" : "#6B6560",
                  background: n.active ? "#2A2318" : "transparent" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="cc-main relative">
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h1 style={{ fontWeight:700, fontSize:"1.5rem", color:"#F7F5F0", margin:0, letterSpacing:"-0.03em", display:"flex", alignItems:"center", gap:"8px" }}>
                <Brain color="#C9A84C" size={24} /> AI Forecasting Hub
              </h1>
              <p style={{ fontSize:"0.875rem", color:"#6B6560", margin:"4px 0 0" }}>
                Powered by Google TimesFM. Predictive intelligence on upcoming government spend.
              </p>
            </div>
            <span style={{ fontSize:"0.72rem", padding:"4px 8px", background:"#C9A84C20", border:"1px solid #C9A84C40", borderRadius:"6px", color:"#C9A84C", fontWeight:600 }}>
              TimesFM Intelligence Active
            </span>
          </div>

          {loading ? (
            <div style={{ padding:"4rem", textAlign:"center", color:"#6B6560" }}>Executing prediction models...</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(400px, 1fr))", gap:"1.5rem" }}>
              {forecasts.map((f, i) => {
                const parts = f.insight_text.split(" || ");
                const insightStr = parts[0];
                let parsedDates: string[] = [];
                if (parts.length > 1) {
                  try {
                    parsedDates = JSON.parse(parts[1]);
                  } catch (e) {}
                }

                const chartData = f.predicted_array.map((val, idx) => {
                  let label = `M${idx + 1}`;
                  if (parsedDates[idx]) {
                    // Extract "26-05" from "2026-05" for cleaner UI
                    const [yyyy, mm] = parsedDates[idx].split('-');
                    if (yyyy && mm) label = `${mm}/${yyyy.slice(-2)}`;
                    else label = parsedDates[idx];
                  }
                  
                  return {
                    month: label,
                    volume: val,
                  };
                });
                const maxVal = Math.max(...f.predicted_array);
                
                return (
                  <div key={f.id || i} style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"14px", padding:"1.5rem", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, right:0, padding:"1.5rem", opacity:0.03, pointerEvents:"none" }}>
                      <TrendingUp size={100} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
                      <div>
                        <h3 style={{ margin:0, color:"#F7F5F0", fontSize:"1.1rem", fontWeight:600 }}>{f.agency_name}</h3>
                        <div style={{ display:"flex", gap:"6px", marginTop:"6px", flexWrap:"wrap" }}>
                          <span style={{ fontSize:"0.68rem", padding:"2px 6px", background:"#1E211A", border:"1px solid #2A3020", borderRadius:"4px", color:"#86EFAC", fontFamily:"var(--font-geist-mono, monospace)" }}>NAICS {f.naics_code}</span>
                          <span style={{ fontSize:"0.68rem", padding:"2px 6px", background:"#1E242C", border:"1px solid #263140", borderRadius:"4px", color:"#93C5FD", textTransform:"uppercase" }}>{f.forecast_type.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"1.25rem", fontWeight:700, color:"#F7F5F0", fontFamily:"var(--font-geist-mono, monospace)" }}>{f.confidence_score}%</div>
                        <div style={{ fontSize:"0.65rem", textTransform:"uppercase", color:"#6B6560", fontWeight:600, letterSpacing:"0.05em" }}>Confidence</div>
                      </div>
                    </div>

                    <div style={{ height:"160px", marginBottom:"1.5rem" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D2A26" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B6560' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B6560' }} domain={[0, maxVal * 1.2]} />
                          <Tooltip 
                            contentStyle={{ background: '#1C1917', border: '1px solid #2D2A26', borderRadius: '8px', color: '#F7F5F0', fontSize: '12px' }}
                            itemStyle={{ color: '#C9A84C' }}
                            cursor={{ stroke: '#2D2A26', strokeWidth: 1 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="volume" 
                            stroke="#C9A84C" 
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 0, fill: '#C9A84C' }} 
                            activeDot={{ r: 6, fill: '#C9A84C', stroke: '#1C1917', strokeWidth: 2 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ background:"#1C1917", borderRadius:"8px", padding:"1rem", display:"flex", gap:"12px", border:"1px solid #2D2A26" }}>
                      <Brain size={16} color="#C9A84C" style={{ flexShrink:0, marginTop:2 }} />
                      <p style={{ margin:0, fontSize:"0.8125rem", color:"#A8A29E", lineHeight:1.5 }}>
                        <strong style={{ color:"#F7F5F0", display:"block", marginBottom:"2px", fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>Insight</strong>
                        {insightStr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && forecasts.length === 0 && (
            <div style={{ padding:"4rem", textAlign:"center", border:"1px dashed #2D2A26", borderRadius:"14px" }}>
              <AlertTriangle color="#FCD34D" size={32} style={{ margin:"0 auto 1rem" }} />
              <h3 style={{ fontSize:"1rem", fontWeight:600, color:"#F7F5F0", margin:"0 0 6px" }}>No Forecasts Generated Yet</h3>
              <p style={{ color:"#6B6560", fontSize:"0.875rem", margin:0, maxWidth:"400px", marginLeft:"auto", marginRight:"auto" }}>
                The TimesFM engine runs weekly on Sundays. Ensure you have active NAICS codes in your profile to trigger predictions.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
