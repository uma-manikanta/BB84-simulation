
import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import { motion } from "framer-motion";

// Utility for gradient id
const makeGradId = (role) => `grad-${role}-${Math.random()}`;

const Computer = ({ role = "Sender", color = "default" }) => {
  const gradId = makeGradId(role);
  let stop1 = "#cbd5e1";
  let stop2 = "#94a3b8";
  if (color === "red") {
    stop1 = "#f87171";
    stop2 = "#dc2626";
  }
  return (
    <div className="computerWrapper">
      <svg width="90" height="70" viewBox="0 0 160 120" className="drop-shadow">
        <defs>
          <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={stop1} />
            <stop offset="100%" stopColor={stop2} />
          </linearGradient>
        </defs>
        <rect
          x="10"
          y="10"
          width="140"
          height="85"
          rx="10"
          fill={`url(#${gradId})`}
          stroke="#0f172a"
          strokeWidth="3"
        />
        <rect x="22" y="22" width="116" height="60" rx="6" fill="#0b1020" />
        <rect x="55" y="100" width="50" height="8" rx="2" fill="#0f172a" />
        <rect x="35" y="108" width="90" height="6" rx="3" fill="#1f2937" />
      </svg>
      <span className="roleLabel">{role}</span>
    </div>
  );
};



export default function AnimationDiv() {
  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [qber, setQber] = useState(null);
  const [siftedKey, setSiftedKey] = useState([]);
  const [correctedKey, setCorrectedKey] = useState(null);
  const [showCorrected, setShowCorrected] = useState(false);

  const [duration, setDuration] = useState(2400); // ms
  const [circleBit, setCircleBit] = useState(null);
  const [circleColor, setCircleColor] = useState("rgb(119,56,236)");
  const [isShocked, setIsShocked] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Parameters for backend
  const [keyLength, setKeyLength] = useState(10);
  const [eveActive, setEveActive] = useState(false);
  const [noisePercent, setNoisePercent] = useState(10);
  const [status, setStatus] = useState("");
  const [afterEve, setAfterEve] = useState("");

  // Simulation data from backend
  const [obj, setObj] = useState([]);
  const current = obj[index] || {};

  // ===== RAF-based animation state (robust pause/resume) =====
  const rafRef = useRef(null);
  const startTimeRef = useRef(0); // performance.now() at (re)start
  const elapsedRef = useRef(0); // ms already elapsed within current bit
  const leftPctRef = useRef(0); // left % (0..95)
  const [leftPct, setLeftPct] = useState(0);

  const eveFiredRef = useRef(false);
  const noiseFiredRef = useRef(false);
  const statusFiredRef = useRef(false);
  const shockEndAtRef = useRef(null); // ms offset after noise to end shock
  const circleRef = useRef(null);


  // ===== Backend fetch =====
  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/?KEY_LENGTH=${keyLength}&is_eve_active=${eveActive}&noise_percent=${noisePercent}`
      );
      const raw = await res.json();
      const data = JSON.parse(raw); // backend double-encodes JSON
      const details = Object.values(data.log_details);

      setObj(details);
      setQber(data.qber);
      setSiftedKey([]);
      setCircleBit(details[0]?.alice?.bit ?? 0);
      setCorrectedKey(data.corrected_key);

      // Reset animation refs completely
      cancelAnimationFrame(rafRef.current);
      elapsedRef.current = 0;
      leftPctRef.current = 0;
      setLeftPct(0);
      eveFiredRef.current = false;
      noiseFiredRef.current = false;
      statusFiredRef.current = false;
      shockEndAtRef.current = null;
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // ===== Build log + sifted key when a new index starts =====
  useEffect(() => {
    if (!isRunning || obj.length === 0) return;
    if (!obj[index]) return;

    const data = obj[index];
    const outcome =
      data.alice.basis === data.bob.basis
        ? data.alice.bit === data.bob.measured_bit
          ? "keep"
          : data.is_noise_flipped
          ? "Noise"
          : "Eve Flipped"
        : "Bases Mismatched";

    const logRow = {
      aliceBit: data.alice.bit,
      aliceBase: data.alice.basis,
      bobBase: data.bob.basis,
      eveBase: data.after_eve?.basis,
      bobBit: data.bob.measured_bit,
      outcome,
    };
    setLogs((prev) => [logRow, ...prev]);

    if (outcome !== "Bases Mismatched") {
      setSiftedKey((prev) => [
        ...prev,
        {
          bit: data.bob.measured_bit,
          correct:
            data.alice.bit === data.bob.measured_bit
              ? "correct"
              : data.is_eve_flipped
              ? "wrong-eve"
              : "wrong-noise",
        },
      ]);
    }
  }, [index, isRunning, obj]);

  // ===== Main RAF loop per bit =====
  useEffect(() => {
    if (!isRunning || isPaused) {
      // Paused: just stop the RAF; keep elapsedRef & leftPct so we can resume.
      cancelAnimationFrame(rafRef.current);
      return;
    }

    if (!obj || !obj[index]) return;

    const data = obj[index];

    // If starting a brand-new bit (not resuming mid-way)
    if (elapsedRef.current === 0) {
      setCircleBit(data.alice.bit);
      setCircleColor("rgb(119, 56, 236)");
      setIsShocked(false);
      setStatus("");
      setLeftPct(0);
      leftPctRef.current = 0;
      eveFiredRef.current = false;
      noiseFiredRef.current = false;
      statusFiredRef.current = false;
      shockEndAtRef.current = null;
    }

    // Start / resume clock
    startTimeRef.current = performance.now() - elapsedRef.current;

    const tick = (now) => {
      const elapsed = now - startTimeRef.current; // ms
      elapsedRef.current = elapsed;

      // progress 0..1
      const t = Math.min(Math.max(elapsed / duration, 0), 1);
      const left = 95 * t;
      leftPctRef.current = left;

      // update DOM node directly (no React re-render)
      if (circleRef.current) {
        circleRef.current.style.left = `${left}%`;
      }

      // Fire EVE flip at 50%
      if (!eveFiredRef.current && elapsed >= duration * 0.5) {
        eveFiredRef.current = true;
        if (data.is_eve_flipped) {
          setCircleBit(data.after_eve.bit);
          setCircleColor("red");
        }
      }

      // Fire NOISE flip at 80%
      if (!noiseFiredRef.current && elapsed >= duration * 0.8) {
        noiseFiredRef.current = true;
        if (data.is_noise_flipped) {
          setCircleBit((prev) => (prev === 0 ? 1 : 0));
          setCircleColor("orange");
          setIsShocked(true);
          shockEndAtRef.current = elapsed + duration * 0.2; // end of shock
        }
      }

      // End shock window
      if (shockEndAtRef.current !== null && elapsed >= shockEndAtRef.current) {
        setIsShocked(false);
        shockEndAtRef.current = null;
      }

      // Finish
      if (!statusFiredRef.current && elapsed >= duration) {
        statusFiredRef.current = true;
        if (data.is_eve_flipped) setStatus("mismatch");
        else if (data.is_noise_flipped) setStatus("noise");
        else setStatus("match");

        // Compute QBER if this was the last bit
        if (!statusFiredRef.current && elapsed >= duration) {
  statusFiredRef.current = true;

  if (data.is_eve_flipped) setStatus("mismatch");
  else if (data.is_noise_flipped) setStatus("noise");
  else setStatus("match");

  if (index >= obj.length - 1) {
    // final QBER calc...
    const total = siftedKey.length;
    const mismatches = siftedKey.filter((b) => b.correct !== "correct").length;
    setQber(total ? ((mismatches / total) * 100).toFixed(2) : "0.00");
    setIsRunning(false);
    cancelAnimationFrame(rafRef.current);
    return;
  }
        }
  // ✅ Wait 1000ms for ripple animation before moving to next bit
  setTimeout(() => {
    elapsedRef.current = 0;
    leftPctRef.current = 0;
    setLeftPct(0);
    setIndex((prev) => prev + 1);
  }, 1000);

  cancelAnimationFrame(rafRef.current);
  return;
}


      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, isPaused, index, duration, obj, siftedKey.length]);

  // ===== Controls =====
  const handleStart = async () => {
    setLogs([]);
    setSiftedKey([]);
    setCorrectedKey(null);
    setShowCorrected(false);
    setIndex(0);

    // Reset animation refs before starting
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    leftPctRef.current = 0;
    setLeftPct(0);
    eveFiredRef.current = false;
    noiseFiredRef.current = false;
    statusFiredRef.current = false;
    shockEndAtRef.current = null;

    await fetchData();
    setIsRunning(true);
    setIsPaused(false);
  };

  return (
    <div className="pageWrapper">
      {/* Controls */}
      <div className="topBar">
        <h1 className="title">BB84 Protocol Simulation</h1>
        <div className="controls">
          <button
            style={{ background: "#1b9949ff", color: "white" }}
            onClick={handleStart}
          >
            Start
          </button>
          <button
            style={{ background: "#facc15" }}
            onClick={() => setIsPaused(true)}
            disabled={!isRunning || isPaused}
          >
            Pause
          </button>
          <button
            style={{ background: "#3b82f6", color: "white" }}
            onClick={() => setIsPaused(false)}
            disabled={!isRunning || !isPaused}
          >
            Resume
          </button>
          <button
            style={{ background: "#ef4444", color: "white" }}
            onClick={() => window.location.reload()}
          >
            Reset
          </button>
          <label className="label">
            Duration (ms):
            <input
              className="durationInput"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
              min="1"
              step="100"
            />
          </label>
          <label className="label">
            Key length:
            <input
              className="keylengthInput"
              type="number"
              value={keyLength}
              onChange={(e) =>
                setKeyLength(Math.max(1, Number(e.target.value)))
              }
              min="1"
            />
          </label>
          <label className="label">
            Eve active:
            <input
              className="eveActiveCheckbox"
              type="checkbox"
              checked={eveActive}
              onChange={(e) => {
                setEveActive(e.target.checked);
                setAfterEve(afterEve === "" ? "aftereve" : "");
              }}
              disabled={isRunning}
              style={{ cursor: isRunning ? "not-allowed" : "pointer" }}
            />
          </label>
          <label className="label">
            Noise:
            <input
              className="noiseInput"
              type="range"
              value={noisePercent}
              onChange={(e) => setNoisePercent(Number(e.target.value))}
              min="1"
              max="100"
            />
            {noisePercent}%
          </label>
        </div>
      </div>

      {/* Lane */}
      <div className="animationPanel">
        <div className={`circleouter ${afterEve}`}>
          <div className={`circle ${status} `}>
            <div className="wave"></div>
          </div>
        </div>

        <div className={`lane ${afterEve}`}>
          {circleBit !== null && (
            <motion.div
             ref={circleRef}
              className={`laneCircle ${isShocked ? "shock" : ""}`}
              key={index}
              style={{
                left: `${leftPct}%`,
                backgroundColor: isShocked ? "orange" : circleColor,
              }}
            >
              {circleBit}
            </motion.div>
          )}
        </div>

        {/* Nodes */}
        <div className="nodePanel">
          <div className="nodeGroup1">
            <Computer role="Sender" />
            <div className="basisLabel">
              Basis: {current?.alice?.basis ?? "?"}
            </div>
          </div>
          {eveActive && (
            <div className="nodeGroup2">
              <Computer role="Eve" color="red" />
              <div className="basisLabel">
                Basis: {current?.after_eve?.basis ?? "?"}
              </div>
            </div>
          )}

          <div className="nodeGroup3">
            <Computer role="Receiver" />
            <div className="basisLabel">
              Basis: {current?.bob?.basis ?? "?"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bottomPanel">
        {/* Transmission log */}
        <div className="card">
          <div className="cardHeader">
            <div className="title">Transmission log</div>
            <div className="value">
              QBER: <span>{qber !== null ? `${qber}%` : "…"}</span>
            </div>
          </div>
          <div className="logTableWrapper">
            <table className="logTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sender bit</th>
                  <th>Sender basis</th>
                  {eveActive && <th>Eve Basis</th>}
                  <th>Receiver basis</th>
                  <th>Receiver bit</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row, i) => (
                  <tr key={logs.length - i}>
                    <td>{logs.length - i}</td>
                    <td>
                      <b>{row.aliceBit}</b>
                    </td>
                    <td>{row.aliceBase}</td>
                    {eveActive && <td>{row.eveBase}</td>}
                    <td>{row.bobBase}</td>
                    <td>{row.bobBit ?? "–"}</td>
                    <td>
                      {row.outcome === "keep" ? (
                        <span className="outcome-keep">keep</span>
                      ) : row.outcome === "Noise" ? (
                        <span className="outcome-noise">Noise</span>
                      ) : row.outcome === "Eve Flipped" ? (
                        <span className="outcome-tampered">Eve Flipped</span>
                      ) : (
                        <span className="outcome-mismatch">
                          Bases Mismatched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sifted key */}
        <div className="card">
          <div className="cardHeader">
            <div className="title">Sifted key (kept bits)</div>
            <div className="value">
              Kept: <span>{siftedKey.length}</span>
            </div>
          </div>
          <div className="siftedContainer">
            {siftedKey.length === 0 ? (
              <div className="siftedEmpty">No bits kept yet…</div>
            ) : (
              siftedKey.map((b, i) => (
                <div key={i} className={`siftedBit ${b.correct}`}>
                  {b.bit}
                </div>
              ))
            )}
          </div>

          {/* Corrected key */}
          {!isRunning && correctedKey && !eveActive && (
            <>
              <button
                onClick={() => setShowCorrected(true)}
                className="correctBtn"
              >
                Show Corrected Key
              </button>
              {showCorrected && (
                <div>
                  <br />
                  <div className="siftedContainer">
                    {correctedKey.map((b, idx) => (
                      <div key={`${b}-${idx}`} className={`siftedBit correct`}>
                        {b}
                      </div>
                    ))}
                  </div>
                  <div className="correctedKeyDisplay">
                    Corrected Key: {correctedKey.join("")}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="siftedNote">
            QBER is shown after animation finishes. Corrected key is only
            available when errors are from noise (not Eve).
          </div>
        </div>
      </div>
    </div>
  );
}
