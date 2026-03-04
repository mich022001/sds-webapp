import { useEffect, useMemo, useState } from "react";

function levelLabel(n) {
  const num = Number(n);
  if (num === 1) return "1ST LEVEL";
  if (num === 2) return "2ND LEVEL";
  if (num === 3) return "3RD LEVEL";
  return `${num}TH LEVEL`;
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/members/list", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`API ${res.status}: ${txt || res.statusText}`);
        }

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

    const grouped = useMemo(() => {
    // Build name -> sponsor map
    const sponsorByName = new Map();
    for (const m of rows) sponsorByName.set(m.name, m.sponsor_name);

    // Compute depth/level with memo + cycle guard
    const memo = new Map();
    function computeLevel(name, seen = new Set()) {
      if (memo.has(name)) return memo.get(name);
      if (seen.has(name)) return 0; // cycle safety
      seen.add(name);

      const sponsor = sponsorByName.get(name);

      // Root: sponsor missing or SDS → level 0 (not shown)
      if (!sponsor || String(sponsor).trim().toUpperCase() === "SDS") {
        memo.set(name, 0);
        return 0;
      }

      // Level = sponsor level + 1
      const lvl = computeLevel(sponsor, seen) + 1;
      memo.set(name, lvl);
      return lvl;
    }

    // Group by computed level (1..)
    const map = new Map(); // level -> names[]
    for (const m of rows) {
      const lvl = computeLevel(m.name);
      if (lvl <= 0) continue; // skip root
      if (!map.has(lvl)) map.set(lvl, []);
      map.get(lvl).push(m.name);
    }

    const levels = Array.from(map.keys()).sort((a, b) => a - b);
    for (const lvl of levels) {
      map.get(lvl).sort((a, b) => String(a).localeCompare(String(b)));
    }

    const maxLen = levels.reduce((mx, lvl) => Math.max(mx, map.get(lvl).length), 0);
    return { map, levels, maxLen };
  }, [rows]);

  const totalMembers = rows.length;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0 }}>SUREFIT DIRECT SALES</h2>
        <div style={{ color: "#777" }}>Summary</div>
      </div>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>Error: {err}</p>}

      {!loading && !err && (
        <>
          {/* Totals row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <div style={boxStyle}>
              <div style={boxLabel}>Total Members</div>
              <div style={boxValue}>{totalMembers}</div>
            </div>

            {grouped.levels.map((lvl) => (
              <div key={lvl} style={boxStyle}>
                <div style={boxLabel}>Total {levelLabel(lvl)}</div>
                <div style={boxValue}>{grouped.map.get(lvl)?.length || 0}</div>
              </div>
            ))}
          </div>

          {/* Column layout like Google Sheet */}
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {grouped.levels.map((lvl) => (
                    <th key={lvl} style={thStyle}>
                      {levelLabel(lvl)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {grouped.maxLen === 0 ? (
                  <tr>
                    <td colSpan={Math.max(grouped.levels.length, 1)} style={tdStyle}>
                      No hierarchy data yet.
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: grouped.maxLen }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      {grouped.levels.map((lvl) => {
                        const names = grouped.map.get(lvl) || [];
                        return (
                          <td key={`${lvl}-${rowIdx}`} style={tdStyle}>
                            {names[rowIdx] || ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const boxStyle = {
  border: "1px solid #e6e6e6",
  borderRadius: 10,
  padding: "10px 12px",
  minWidth: 190,
  background: "#fafafa",
};

const boxLabel = { fontSize: 12, color: "#666" };
const boxValue = { fontSize: 22, fontWeight: 700 };

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 700,
  borderBottom: "2px solid #ddd",
  background: "#f9f9f9",
  whiteSpace: "nowrap",
};

const tdStyle = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
};
