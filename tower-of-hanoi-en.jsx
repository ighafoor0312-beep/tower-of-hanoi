import { useState, useEffect, useRef } from "react";

const COLORS = [
  "#FF6B6B", "#FF9F43", "#FECA57", "#48DBFB", "#FF9FF3",
  "#54A0FF", "#5F27CD", "#00D2D3", "#1DD1A1", "#C8D6E5"
];

function generateMoves(n, from, to, aux, moves = []) {
  if (n === 0) return moves;
  generateMoves(n - 1, from, aux, to, moves);
  moves.push({ from, to, disk: n });
  generateMoves(n - 1, aux, to, from, moves);
  return moves;
}

function Rod({ name, label, disks, maxDisks, highlight }) {
  const rodHeight = 220;
  const baseWidth = 200;
  const diskMaxWidth = 160;
  const diskMinWidth = 40;
  const diskHeight = 22;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      position: "relative", width: `${baseWidth}px`
    }}>
      <div style={{
        fontSize: "13px", fontWeight: "700", color: highlight ? "#FECA57" : "#aaa",
        marginBottom: "8px", letterSpacing: "2px", textTransform: "uppercase",
        transition: "color 0.3s"
      }}>{label}</div>
      <div style={{ position: "relative", width: `${baseWidth}px`, height: `${rodHeight}px` }}>
        {/* Base */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: `${baseWidth - 10}px`, height: "14px",
          background: "linear-gradient(180deg, #4a5568, #2d3748)",
          borderRadius: "7px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
        }} />
        {/* Pole */}
        <div style={{
          position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)",
          width: "12px", height: `${rodHeight - 14}px`,
          background: highlight
            ? "linear-gradient(180deg, #FECA57, #FF9F43)"
            : "linear-gradient(180deg, #718096, #4a5568)",
          borderRadius: "6px",
          boxShadow: highlight ? "0 0 20px rgba(254,202,87,0.6)" : "none",
          transition: "all 0.3s"
        }} />
        {/* Disks */}
        {disks.map((diskNum, i) => {
          const ratio = (maxDisks - diskNum) / (maxDisks - 1 + 0.001);
          const width = diskMinWidth + ratio * (diskMaxWidth - diskMinWidth);
          const bottom = 14 + i * (diskHeight + 3);
          return (
            <div key={diskNum} style={{
              position: "absolute",
              bottom: `${bottom}px`,
              left: "50%",
              transform: "translateX(-50%)",
              width: `${width}px`,
              height: `${diskHeight}px`,
              background: `linear-gradient(135deg, ${COLORS[(diskNum - 1) % COLORS.length]}dd, ${COLORS[(diskNum - 1) % COLORS.length]}88)`,
              borderRadius: "11px",
              border: `2px solid ${COLORS[(diskNum - 1) % COLORS.length]}`,
              boxShadow: `0 2px 10px ${COLORS[(diskNum - 1) % COLORS.length]}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: "800", color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: i + 1
            }}>
              {diskNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HanoiApp() {
  const [numDisks, setNumDisks] = useState(3);
  const [rods, setRods] = useState({ A: [], B: [], C: [] });
  const [moves, setMoves] = useState([]);
  const [currentMove, setCurrentMove] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const [activeRods, setActiveRods] = useState({ from: null, to: null });
  const [tab, setTab] = useState("visual");
  const intervalRef = useRef(null);

  const initRods = (n) => {
    const initial = { A: [], B: [], C: [] };
    for (let i = n; i >= 1; i--) initial.A.push(i);
    setRods(initial);
    const allMoves = generateMoves(n, "A", "C", "B");
    setMoves(allMoves);
    setCurrentMove(-1);
    setIsPlaying(false);
    setActiveRods({ from: null, to: null });
  };

  useEffect(() => { initRods(numDisks); }, [numDisks]);

  const applyMove = (state, move) => {
    const newRods = { A: [...state.A], B: [...state.B], C: [...state.C] };
    const disk = newRods[move.from].pop();
    newRods[move.to].push(disk);
    return newRods;
  };

  const stepForward = () => {
    if (currentMove + 1 >= moves.length) return;
    const nextIdx = currentMove + 1;
    const move = moves[nextIdx];
    setActiveRods({ from: move.from, to: move.to });
    setRods(prev => applyMove(prev, move));
    setCurrentMove(nextIdx);
  };

  const stepBack = () => {
    if (currentMove < 0) return;
    let state = { A: [], B: [], C: [] };
    for (let i = numDisks; i >= 1; i--) state.A.push(i);
    for (let i = 0; i < currentMove; i++) state = applyMove(state, moves[i]);
    const prevMove = currentMove > 0 ? moves[currentMove - 1] : null;
    setRods(state);
    setCurrentMove(currentMove - 1);
    setActiveRods(prevMove ? { from: prevMove.from, to: prevMove.to } : { from: null, to: null });
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentMove(prev => {
          if (prev + 1 >= moves.length) {
            setIsPlaying(false);
            setActiveRods({ from: null, to: null });
            return prev;
          }
          const move = moves[prev + 1];
          setActiveRods({ from: move.from, to: move.to });
          setRods(r => applyMove(r, move));
          return prev + 1;
        });
      }, speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, moves]);

  const reset = () => { initRods(numDisks); };
  const done = currentMove === moves.length - 1;
  const totalMoves = Math.pow(2, numDisks) - 1;

  const rodLabels = { A: "🏠 Start", B: "🔄 Helper", C: "🎯 Goal" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
      padding: "20px"
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{
            fontSize: "2.2rem", fontWeight: "900", margin: 0,
            background: "linear-gradient(90deg, #FECA57, #FF6B6B, #48DBFB)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>🗼 Tower of Hanoi</h1>
          <p style={{ color: "#aaa", marginTop: "6px", fontSize: "15px" }}>
            Learn by playing — step through every move!
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
          {[["visual", "🎮 Animation"], ["learn", "📚 Learn"], ["code", "💻 Code"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "8px 20px", borderRadius: "20px", border: "none", cursor: "pointer",
              background: tab === key ? "linear-gradient(135deg, #FECA57, #FF9F43)" : "rgba(255,255,255,0.1)",
              color: tab === key ? "#1a1a2e" : "#fff",
              fontWeight: "700", fontSize: "14px", transition: "all 0.2s"
            }}>{label}</button>
          ))}
        </div>

        {/* ── ANIMATION TAB ── */}
        {tab === "visual" && (
          <div style={{
            background: "rgba(255,255,255,0.05)", borderRadius: "20px",
            padding: "24px", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#aaa" }}>Disks:</span>
                {[2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setNumDisks(n)} style={{
                    width: "36px", height: "36px", borderRadius: "50%", border: "none",
                    background: numDisks === n ? "linear-gradient(135deg, #48DBFB, #54A0FF)" : "rgba(255,255,255,0.1)",
                    color: "#fff", fontWeight: "800", cursor: "pointer", fontSize: "15px"
                  }}>{n}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#aaa" }}>Speed:</span>
                {[["🐢 Slow", 1200], ["🚶 Normal", 700], ["🏃 Fast", 350]].map(([label, s]) => (
                  <button key={s} onClick={() => setSpeed(s)} style={{
                    padding: "6px 12px", borderRadius: "12px", border: "none", cursor: "pointer",
                    background: speed === s ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: "13px", fontWeight: speed === s ? "700" : "400"
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Progress badge */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <span style={{
                padding: "6px 16px", borderRadius: "20px",
                background: done ? "linear-gradient(135deg, #1DD1A1, #00b894)" : "rgba(255,255,255,0.1)",
                fontSize: "14px", fontWeight: "700"
              }}>
                {done ? "🎉 Solved! Well done!" : `Move ${Math.max(0, currentMove + 1)} of ${totalMoves}`}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "6px", margin: "0 20px 20px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "10px",
                width: `${((currentMove + 1) / totalMoves) * 100}%`,
                background: "linear-gradient(90deg, #48DBFB, #1DD1A1)",
                transition: "width 0.3s"
              }} />
            </div>

            {/* Rods */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "8px", marginBottom: "20px" }}>
              {["A", "B", "C"].map(rod => (
                <Rod key={rod} name={rod} label={rodLabels[rod]}
                  disks={rods[rod]} maxDisks={numDisks}
                  highlight={activeRods.from === rod || activeRods.to === rod} />
              ))}
            </div>

            {/* Move hint */}
            {activeRods.from && (
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <span style={{
                  padding: "8px 20px", borderRadius: "20px",
                  background: "rgba(254,202,87,0.15)", border: "1px solid rgba(254,202,87,0.4)",
                  fontSize: "14px", color: "#FECA57"
                }}>
                  Moving from {rodLabels[activeRods.from]} → {rodLabels[activeRods.to]}
                </span>
              </div>
            )}

            {/* Playback buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={reset} style={{
                padding: "10px 20px", borderRadius: "12px", border: "none", cursor: "pointer",
                background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: "700"
              }}>🔄 Reset</button>
              <button onClick={stepBack} disabled={currentMove < 0} style={{
                padding: "10px 20px", borderRadius: "12px", border: "none", cursor: "pointer",
                background: "rgba(84,160,255,0.2)", color: "#fff", fontWeight: "700",
                opacity: currentMove < 0 ? 0.4 : 1
              }}>⬅️ Back</button>
              <button onClick={() => setIsPlaying(!isPlaying)} disabled={done} style={{
                padding: "10px 28px", borderRadius: "12px", border: "none", cursor: "pointer",
                background: isPlaying ? "linear-gradient(135deg, #FF6B6B, #ee5a24)" : "linear-gradient(135deg, #1DD1A1, #10ac84)",
                color: "#fff", fontWeight: "800", fontSize: "16px",
                opacity: done ? 0.4 : 1, boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
              }}>{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
              <button onClick={stepForward} disabled={done} style={{
                padding: "10px 20px", borderRadius: "12px", border: "none", cursor: "pointer",
                background: "rgba(84,160,255,0.2)", color: "#fff", fontWeight: "700",
                opacity: done ? 0.4 : 1
              }}>➡️ Next</button>
            </div>
          </div>
        )}

        {/* ── LEARN TAB ── */}
        {tab === "learn" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                emoji: "🎯", title: "What's the Goal?",
                color: "#FF6B6B",
                text: "Move ALL disks from the Start rod (left) to the Goal rod (right) — using the Helper rod in between."
              },
              {
                emoji: "📏", title: "Rule 1: One disk at a time",
                color: "#FECA57",
                text: "Each move consists of taking the top disk from one rod and placing it on top of another rod. You can only move one disk per turn."
              },
              {
                emoji: "🚫", title: "Rule 2: No big disk on a small disk!",
                color: "#FF9F43",
                text: "You can never place a larger disk on top of a smaller disk. Think of trying to balance a watermelon on top of an apple — it just doesn't work! 🍉🚫🍎"
              },
              {
                emoji: "🔁", title: "The Secret: Recursion",
                color: "#48DBFB",
                text: "For n disks: First move the top n-1 disks to the helper rod. Then move the biggest disk to the goal. Finally move the n-1 disks from helper to goal. That's it — the same trick repeated!"
              },
              {
                emoji: "🧮", title: "The Magic Formula: 2ⁿ − 1",
                color: "#1DD1A1",
                text: "3 disks = 7 moves | 4 disks = 15 moves | 10 disks = 1,023 moves! Every extra disk doubles the number of moves needed. It grows exponentially fast!"
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px",
                border: `1px solid ${item.color}44`, backdropFilter: "blur(10px)",
                display: "flex", gap: "16px", alignItems: "flex-start"
              }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px", flexShrink: 0,
                  background: `${item.color}22`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "24px"
                }}>{item.emoji}</div>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "16px", color: item.color, marginBottom: "6px" }}>{item.title}</div>
                  <div style={{ color: "#ccc", lineHeight: "1.7", fontSize: "14px" }}>{item.text}</div>
                </div>
              </div>
            ))}

            {/* Valid vs Invalid visual */}
            <div style={{
              background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ fontWeight: "800", marginBottom: "16px", color: "#FF9FF3", fontSize: "15px" }}>✅ Allowed vs ❌ Not Allowed</div>
              <div style={{ display: "flex", gap: "40px", justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#1DD1A1", fontWeight: "700", marginBottom: "10px", fontSize: "13px" }}>✅ Valid Stack</div>
                  {[40, 100, 150].map((w, i) => (
                    <div key={i} style={{
                      width: `${w}px`, height: "22px", borderRadius: "11px", margin: "4px auto",
                      background: `linear-gradient(135deg, ${COLORS[i]}dd, ${COLORS[i]}88)`,
                      border: `2px solid ${COLORS[i]}`
                    }} />
                  ))}
                  <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>Small on top of large ✓</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#FF6B6B", fontWeight: "700", marginBottom: "10px", fontSize: "13px" }}>❌ Invalid Stack</div>
                  {[150, 100, 40].map((w, i) => (
                    <div key={i} style={{
                      width: `${w}px`, height: "22px", borderRadius: "11px", margin: "4px auto",
                      background: `linear-gradient(135deg, ${COLORS[i + 3]}dd, ${COLORS[i + 3]}88)`,
                      border: `2px solid ${COLORS[i + 3]}`,
                      boxShadow: i === 0 ? "0 0 18px rgba(255,100,100,0.9)" : "none"
                    }} />
                  ))}
                  <div style={{ fontSize: "12px", color: "#FF6B6B", marginTop: "8px" }}>Large on top of small ✗</div>
                </div>
              </div>
            </div>

            {/* Step-by-step walkthrough for 3 disks */}
            <div style={{
              background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px",
              border: "1px solid rgba(72,219,251,0.3)"
            }}>
              <div style={{ fontWeight: "800", marginBottom: "14px", color: "#48DBFB", fontSize: "15px" }}>
                🪜 Step-by-step: 3 Disks (7 moves)
              </div>
              {[
                ["Move disk 1", "Start → Goal"],
                ["Move disk 2", "Start → Helper"],
                ["Move disk 1", "Goal → Helper"],
                ["Move disk 3", "Start → Goal"],
                ["Move disk 1", "Helper → Start"],
                ["Move disk 2", "Helper → Goal"],
                ["Move disk 1", "Start → Goal"],
              ].map(([action, path], i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "8px 0", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.06)" : "none"
                }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i+2) % COLORS.length]})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: "800"
                  }}>{i + 1}</div>
                  <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px", minWidth: "110px" }}>{action}</span>
                  <span style={{ color: "#aaa", fontSize: "13px" }}>{path}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CODE TAB ── */}
        {tab === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{
              background: "rgba(0,0,0,0.4)", borderRadius: "20px", padding: "24px",
              border: "1px solid rgba(255,255,255,0.1)", fontFamily: "monospace"
            }}>
              <div style={{ color: "#FECA57", fontWeight: "700", marginBottom: "16px", fontSize: "16px", fontFamily: "sans-serif" }}>
                🐍 Python — just 6 lines of logic!
              </div>
              <pre style={{
                background: "rgba(255,255,255,0.05)", borderRadius: "12px",
                padding: "20px", overflow: "auto", lineHeight: "2", fontSize: "14px", margin: 0,
                color: "#e2e8f0"
              }}>
{`def hanoi(n, from_rod, to_rod, aux_rod):
    if n == 1:
        print(f"Move disk 1: {from_rod} → {to_rod}")
        return

    # Step 1: move n-1 disks out of the way
    hanoi(n - 1, from_rod, aux_rod, to_rod)

    # Step 2: move the biggest disk to the goal
    print(f"Move disk {n}: {from_rod} → {to_rod}")

    # Step 3: move n-1 disks on top of the biggest
    hanoi(n - 1, aux_rod, to_rod, from_rod)

# Run it:
hanoi(3, "A", "C", "B")`}
              </pre>
            </div>

            {/* How recursion works */}
            <div style={{
              background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px",
              border: "1px solid rgba(255,159,243,0.3)"
            }}>
              <div style={{ fontWeight: "800", color: "#FF9FF3", marginBottom: "14px", fontSize: "15px" }}>
                🧠 How does the recursion work?
              </div>
              {[
                { label: "Base case", desc: "If there's only 1 disk, just move it. Done!", color: "#1DD1A1" },
                { label: "Recursive step", desc: "Trust that hanoi(n-1) works perfectly. Use it to clear the way.", color: "#48DBFB" },
                { label: "The trick", desc: "Each call breaks the problem into 3 smaller steps until n=1.", color: "#FECA57" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: "12px", alignItems: "flex-start",
                  padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none"
                }}>
                  <div style={{
                    padding: "4px 10px", borderRadius: "8px", flexShrink: 0,
                    background: `${item.color}22`, color: item.color,
                    fontSize: "12px", fontWeight: "700", marginTop: "2px"
                  }}>{item.label}</div>
                  <div style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.6" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Complexity table */}
            <div style={{
              background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "20px",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ fontWeight: "800", color: "#48DBFB", marginBottom: "14px", fontSize: "15px" }}>
                📊 Time Complexity: O(2ⁿ)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  ["2", "3", "#1DD1A1"],
                  ["3", "7", "#FECA57"],
                  ["5", "31", "#FF9F43"],
                  ["10", "1,023", "#FF6B6B"],
                  ["20", "1,048,575", "#FF6B6B"],
                  ["64", "18,446,744,073,709,551,615", "#c0392b"],
                ].map(([n, result, color]) => (
                  <div key={n} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)"
                  }}>
                    <span style={{ color: "#aaa", fontSize: "14px" }}>n = <strong style={{ color: "#fff" }}>{n}</strong></span>
                    <span style={{ color, fontWeight: "700", fontSize: "14px" }}>{result} moves</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "12px", color: "#888", fontSize: "12px", fontStyle: "italic" }}>
                * n=64 would take ~585 billion years at 1 move/second 🤯
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
