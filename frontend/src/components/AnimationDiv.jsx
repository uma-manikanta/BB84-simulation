import CryptoJS from "crypto-js";
import startIcon from "../images/start.png";
import pauseIcon from "../images/pause.png";
import resumeIcon from "../images/resume.png";
import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import { motion } from "framer-motion";
import plusSign from "../images/plus-sign.png";
import cancelSign from "../images/cancel.png";
import horizontal from "../images/0.png";
import vertical from "../images/90.png";
import zero from "../images/45.png";
import one from "../images/135.png";
import fastForwradIcon from "../images/fast-forward.png";
import resetIcon from "../images/undo-arrow.png";
// Utility for gradient id
const makeGradId = (role) => `grad-${role}-${Math.random()}`;

const Computer = ({ role = "Sender", color = "default", current_basis }) => {
  const gradId = makeGradId(role);
  let stop1 = "#cbd5e1";
  let stop2 = "#94a3b8";
  if (color === "red") {
    stop1 = "#f87171";
    stop2 = "#dc2626";
  }

  return (
    <div className="computerWrapper">
      {/* SVG computer */}
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

      {/* Overlay icon inside screen */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "25px",
          width: "40px",
          height: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {current_basis ? (
          current_basis === "Z" ? (
            <img src={plusSign} alt="plus sign" width="30" height="30" />
          ) : (
            <img src={cancelSign} alt="cancel sign" width="30" height="30" />
          )
        ) : (
          "?"
        )}
      </div>

      {/* Role label */}
      <span className="roleLabel">{role}</span>
    </div>
  );
};

export default function AnimationDiv() {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  const [logs, setLogs] = useState([]);
  const [qber, setQber] = useState(null);
  const [qberRef] = useState({ current: null });

  const [siftedKey, setSiftedKey] = useState([]);
  const siftedKeyRef = useRef([]);
  useEffect(() => {
    siftedKeyRef.current = siftedKey;
  }, [siftedKey]);

  const [correctedKey, setCorrectedKey] = useState(null);
  const [showCorrected, setShowCorrected] = useState(false);

  const [duration, setDuration] = useState(2400); // ms
  const durationRef = useRef(duration);
  useEffect(() => {
    durationRef.current = Math.max(1, Number(duration));
  }, [duration]);

  const [circleBit, setCircleBit] = useState(null);
  const [circleBasis, setCircleBasis] = useState(null);
  const [circleColor, setCircleColor] = useState("rgb(119,56,236)");
  const [isShocked, setIsShocked] = useState(false);

  const [senderMessage, setSenderMessage] = useState("");
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [receiverMessage, setReceiverMessage] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [encryptionMethod, setEncryptionMethod] = useState("XOR");

  // only Receiver key is editable
  const [receiverKey, setReceiverKey] = useState("");
  const senderKey = siftedKey.map((b) => b.bit).join(""); // from simulation

  // ===== Helpers for encryption =====
  const getKeyString = () => siftedKey.map((b) => b.bit).join("") || "0";

  const xorEncryptDecrypt = (text, keyBits) => {
    if (!keyBits) return text;
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyBit = parseInt(keyBits[i % keyBits.length]);
      result += String.fromCharCode(charCode ^ keyBit);
    }
    return result;
  };

  const aesEncrypt = (text, keyBits) => {
    const key = CryptoJS.SHA256(keyBits).toString().slice(0, 32);
    return CryptoJS.AES.encrypt(text, key).toString();
  };

  const aesDecrypt = (cipher, keyBits) => {
    try {
      const key = CryptoJS.SHA256(keyBits).toString().slice(0, 32);
      const bytes = CryptoJS.AES.decrypt(cipher, key);
      return bytes.toString(CryptoJS.enc.Utf8); // empty string if wrong key
    } catch {
      return "";
    }
  };

  const handleEncrypt = () => {
    if (!senderKey) {
      setEncryptedMessage("⚠️ No sifted key from simulation");
      return;
    }
    if (encryptionMethod === "XOR") {
      setEncryptedMessage(btoa(xorEncryptDecrypt(senderMessage, senderKey)));
    } else {
      setEncryptedMessage(aesEncrypt(senderMessage, senderKey));
    }
  };

  const handleDecrypt = () => {
    if (!receiverKey) {
      setDecryptedMessage("⚠️ Please enter a sifted key");
      return;
    }
    try {
      if (encryptionMethod === "XOR") {
        const dec = xorEncryptDecrypt(atob(receiverMessage), receiverKey);
        setDecryptedMessage(dec);
      } else {
        const dec = aesDecrypt(receiverMessage, receiverKey);
        setDecryptedMessage(dec || "⚠️ Could not decrypt");
      }
    } catch {
      setDecryptedMessage("⚠️ Decryption failed");
    }
  };

  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Parameters for backend
  const [keyLength, setKeyLength] = useState(10);
  const [eveActive, setEveActive] = useState(false);
  const [noisePercent, setNoisePercent] = useState(10);
  const [status, setStatus] = useState("");
  const [afterEve, setAfterEve] = useState("");

  // Simulation data from backend
  const [obj, setObj] = useState([]);
  const objRef = useRef([]);
  useEffect(() => {
    objRef.current = obj;
  }, [obj]);

  const current = obj[index] || {};

  // Animation refs
  const rafRef = useRef(null);
  const startTimeRef = useRef(0); // high-res timestamp when current anim started
  const elapsedRef = useRef(0); // ms elapsed inside current anim
  const leftPctRef = useRef(0);
  const [leftPct, setLeftPct] = useState(0);

  const eveFiredRef = useRef(false);
  const noiseFiredRef = useRef(false);
  const statusFiredRef = useRef(false);
  const shockEndAtRef = useRef(null); // absolute timestamp when shock ends
  const circleRef = useRef(null);

  // Phase machine: 'idle' | 'animating' | 'waiting'
  const phaseRef = useRef("idle");
  const waitUntilRef = useRef(0);

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
      objRef.current = details;
      setQber(data.qber);
      qberRef.current = data.qber;
      setSiftedKey([]);
      siftedKeyRef.current = [];
      setCircleBit(details[0]?.alice?.bit ?? 0);
      setCircleBasis(details[0]?.alice?.basis ?? "+");
      setCorrectedKey(data.corrected_key);

      // Reset animation refs completely
      cancelAnimationFrame(rafRef.current);
      startTimeRef.current = 0;
      elapsedRef.current = 0;
      leftPctRef.current = 0;
      setLeftPct(0);
      eveFiredRef.current = false;
      noiseFiredRef.current = false;
      statusFiredRef.current = false;
      shockEndAtRef.current = null;

      // reset phase & index
      phaseRef.current = "idle";
      setIndex(0);
      indexRef.current = 0;
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Keep indexRef in sync whenever state index changes
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Build log + sifted key when a new index starts
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
      eveBit: data.after_eve?.bit,
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

  // Sync durationRef min threshold (>=16ms rAF frame threshold is better)
  useEffect(() => {
    // keep a minimum of 1ms user-level, but effective animation uses at least 16ms
    durationRef.current = Math.max(1, Number(duration));
  }, [duration]);
  // Smoothly rescale elapsed time when duration changes
  useEffect(() => {
    const oldDur = durationRef.current;
    const newDur = Math.max(16, duration); // effective min
    if (elapsedRef.current > 0 && oldDur > 0) {
      const progress = elapsedRef.current / oldDur;
      elapsedRef.current = progress * newDur;
      // also shift startTime so animation continues without jump
      startTimeRef.current = performance.now() - elapsedRef.current;
    }
    durationRef.current = newDur;
  }, [duration]);

  // Main single RAF loop (reads dynamic values from refs)
  useEffect(() => {
    let running = false;

    const loop = (now) => {
      // Stop if not running
      if (!isRunningRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        phaseRef.current = "idle";
        startTimeRef.current = 0;
        elapsedRef.current = 0;
        return;
      }

      // If paused, keep scheduling but don't advance timelines
      if (isPausedRef.current) {
        // reset startTime so animation resumes cleanly
        startTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // get effective duration (cap at at least 16ms to match rAF)
      const effectiveDuration = Math.max(16, durationRef.current);

      // Ensure we have data
      const list = objRef.current;
      const idx = indexRef.current;
      const data = list[idx];
      if (!data) {
        // nothing more to play — stop gracefully
        setIsRunning(false);
        rafRef.current = null;
        phaseRef.current = "idle";
        return;
      }

      if (phaseRef.current === "idle") {
        // Initialize a new bit animation
        phaseRef.current = "animating";
        startTimeRef.current = 0;
        elapsedRef.current = 0;
        leftPctRef.current = 0;
        setLeftPct(0);

        // reset flags
        eveFiredRef.current = false;
        noiseFiredRef.current = false;
        statusFiredRef.current = false;
        shockEndAtRef.current = null;

        // set circle visuals to alice's starting state
        // console.log("Main RAF LOOP: LINE 384 (PREV)" + circleBit);
        setCircleBit(data.alice.bit);
        // console.log("Main RAF LOOP: LINE 384 (AFTE)" + circleBit);
        // console.log("Main RAF LOOP: LINE 384 (PREV)" + circleBasis);
        setCircleBasis(data.alice.basis);
        // console.log("Main RAF LOOP: LINE 384 (AFTE)" + circleBasis);
        // setCircleColor("rgb(119,56,236)");
        
        setIsShocked(false);
      }

      if (phaseRef.current === "animating") {
        setCircleBit(data.alice.bit);
        setCircleBasis(data.alice.basis);
        if (startTimeRef.current === 0)
          startTimeRef.current = now - elapsedRef.current;
        const elapsed = now - startTimeRef.current;
        elapsedRef.current = elapsed;

        // progress 0..1
        const t = Math.min(elapsed / effectiveDuration, 1);
        const left = 95 * t;
        leftPctRef.current = left;
        // update UI (we set both style and state to make sure it's smooth)
        if (circleRef.current) {
          circleRef.current.style.left = `${left}%`;
        }
        setLeftPct(left);

        // Eve at 50%
        if (!eveFiredRef.current && elapsed >= effectiveDuration * 0.5) {
          eveFiredRef.current = true;
          if (data.is_eve_flipped && data.after_eve) {
            setCircleBit(data.after_eve.bit);
            setCircleBasis(data.after_eve.basis);
            setCircleColor("red");
          }
        }

        // Noise at 80%
        if (!noiseFiredRef.current && elapsed >= effectiveDuration * 0.8) {
          noiseFiredRef.current = true;
          if (data.is_noise_flipped) {
            setCircleBit((prev) => (prev === 0 ? 1 : 0));
            setCircleColor("orange");
            setIsShocked(true);
            // set shock end to elapsed + 20% of effectiveDuration
            shockEndAtRef.current = now + effectiveDuration * 0.2;
          }
        }

        // End shock based on absolute timestamp
        if (shockEndAtRef.current !== null && now >= shockEndAtRef.current) {
          setIsShocked(false);
          shockEndAtRef.current = null;
        }

        // Finish this bit
        if (!statusFiredRef.current && elapsed >= effectiveDuration) {
          statusFiredRef.current = true;
          // set status
          if (data.alice.bit === data.bob.measured_bit) setStatus("match");
          else setStatus("mismatch");

          // If last bit, compute QBER and stop after the required wait
          const isLast = idx >= list.length - 1;
          if (isLast) {
            const total = siftedKeyRef.current.length;
            const mismatches = siftedKeyRef.current.filter(
              (b) => b.correct !== "correct"
            ).length;
            const q = total ? ((mismatches / total) * 100).toFixed(2) : "0.00";
            setQber(q);
            qberRef.current = q;
            // wait at least 1s so user sees final status, then stop
            phaseRef.current = "waiting";
            waitUntilRef.current =
              now + Math.max(1000, effectiveDuration * 0.3);
          } else {
            // Normal: show result then wait before next bit
            phaseRef.current = "waiting";
            // <-- IMPORTANT: ensure next bit start after at least 1000ms so user sees green/red/orange -->
            waitUntilRef.current =
              now + Math.max(1000, effectiveDuration * 0.3);
          }
        }
      } else if (phaseRef.current === "waiting") {
        if (now >= waitUntilRef.current) {
          // move to next bit
          // Reset per-bit timing
          startTimeRef.current = 0;
          elapsedRef.current = 0;
          leftPctRef.current = 0;
          setLeftPct(0);

          // move index (update both state and ref)
          const next = indexRef.current + 1;
          setIndex(next);
          indexRef.current = next;

          // reset flags for next bit
          eveFiredRef.current = false;
          noiseFiredRef.current = false;
          statusFiredRef.current = false;
          shockEndAtRef.current = null;
          setIsShocked(false);
          setStatus(""); // clear status for next animation

          // start animating new bit on next tick
          phaseRef.current = "animating";
          startTimeRef.current = 0;
          elapsedRef.current = 0;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    // Start loop when running toggles on
    if (isRunning) {
      running = true;
      rafRef.current = requestAnimationFrame(loop);
    }

    // Cleanup
    return () => {
      running = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning]); // only start/stop the loop when isRunning toggles
  const handleFastForward = () => {
    const list = objRef.current;
    if (!list || list.length === 0) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    isRunningRef.current = false;
    setIsRunning(false);

    // Clear old state
    setLogs([]);
    setSiftedKey([]);
    const logsArr = [];
    const siftedArr = [];

    // Process all bits instantly
    for (let i = 0; i < list.length; i++) {
      const data = list[i];
      const outcome =
        data.alice.basis === data.bob.basis
          ? data.alice.bit === data.bob.measured_bit
            ? "keep"
            : data.is_noise_flipped
              ? "Noise"
              : "Eve Flipped"
          : "Bases Mismatched";

      logsArr.unshift({
        aliceBit: data.alice.bit,
        aliceBase: data.alice.basis,
        eveBase: data.after_eve?.basis,
        eveBit: data.after_eve?.bit,
        bobBase: data.bob.basis,
        bobBit: data.bob.measured_bit,
        outcome,
      });

      if (outcome !== "Bases Mismatched") {
        siftedArr.push({
          bit: data.bob.measured_bit,
          correct:
            data.alice.bit === data.bob.measured_bit
              ? "correct"
              : data.is_eve_flipped
                ? "wrong-eve"
                : "wrong-noise",
        });
      }
    }

    setLogs(logsArr);
    setSiftedKey(siftedArr);

    // Set QBER
    const total = siftedArr.length;
    const mismatches = siftedArr.filter((b) => b.correct !== "correct").length;
    const q = total ? ((mismatches / total) * 100).toFixed(2) : "0.00";
    setQber(q);
    qberRef.current = q;

    // Jump circle to final state
    const last = list[list.length - 1];
    setCircleBit(last.alice.bit);
    setCircleBasis(last.alice.basis);
    setCircleColor("rgb(119,56,236)");
    setLeftPct(95); // move to end
    setStatus(""); // optional: clear match/mismatch color
    setIsShocked(false);

    // Allow showing corrected key
    setCorrectedKey((prev) => prev ?? null);
    setShowCorrected(false);
  };

  // ===== Controls =====
  const handleStart = async () => {
    setLogs([]);
    setSiftedKey([]);
    setCorrectedKey(null);
    setShowCorrected(false);

    // Reset UI/ref state
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = 0;
    elapsedRef.current = 0;
    leftPctRef.current = 0;
    setLeftPct(0);
    eveFiredRef.current = false;
    noiseFiredRef.current = false;
    statusFiredRef.current = false;
    shockEndAtRef.current = null;
    phaseRef.current = "idle";

    setIndex(0);
    indexRef.current = 0;

    await fetchData();

    // start
    setIsPaused(false);
    isPausedRef.current = false;
    setIsRunning(true);
    isRunningRef.current = true;
  };

  // Pause / Resume handlers update both state and refs
  const handlePause = () => {
    setIsPaused(true);
    isPausedRef.current = true;
  };
  const handleResume = () => {
    setIsPaused(false);
    isPausedRef.current = false;
  };

  return (
    <div className="pageWrapper">
      {/* Controls */}
      <div className="topBar">
        <h1 className="title">Controls</h1>
        <div className="controls">
          <button
            className="startBtn"
            onClick={handleStart}
            disabled={isRunning}
          >
            <span>Start</span>
            <img src={startIcon} alt="Start" />
          </button>

          <button
            className="pauseBtn"
            onClick={handlePause}
            disabled={!isRunning || isPaused}
          >
            <span>Pause</span>
            <img src={pauseIcon} alt="Pause" />
          </button>

          <button
            className="resumeBtn"
            onClick={handleResume}
            disabled={!isRunning || !isPaused}
          >
            <span>Resume</span>
            <img src={resumeIcon} alt="Resume" />
          </button>

          <button className="resetBtn" onClick={() => window.location.reload()}>
            <span>Reset</span>
            <img src={resetIcon} alt="Reset" />
          </button>

          <button
            className="fastForwardBtn"
            onClick={handleFastForward}
            disabled={!isRunning}
          >
            <span>Fast Forward</span>
            <img src={fastForwradIcon} alt="Fast Forward" />
          </button>

          <label className="label">
            Duration (ms):
            <input
              className="durationInput"
              type="number"
              value={duration}
              onChange={(e) => {
                // accept user small values, but effective duration uses at least 16ms.
                const v = Number(e.target.value) || 1;
                setDuration(v);
                durationRef.current = v;
              }}
              min="1"
              step="1"
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
              {/* {console.log(circleBasis, circleBit)} */}
              {circleBasis == "Z" ? (
                circleBit == 0 ? (
                  <img
                    src={horizontal}
                    alt="plus sign"
                    width="40"
                    height="40"
                  />
                ) : (
                  <img src={vertical} alt="plus sign" width="40" height="40" />
                )
              ) : circleBit == 0 ? (
                <img src={zero} alt="plus sign" width="40" height="40" />
              ) : (
                <img src={one} alt="plus sign" width="40" height="40" />
              )}
            </motion.div>
          )}
        </div>

        {/* Nodes */}
        <div className="nodePanel">
          <div className="nodeGroup1">
            <Computer role="Sender" current_basis={current?.alice?.basis} />
            <div
              className="basisLabel"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>Basis:</span>
              {current?.alice?.basis ? (
                current.alice.basis === "Z" ? (
                  <img src={plusSign} alt="plus sign" width="40" height="40" />
                ) : (
                  <img
                    src={cancelSign}
                    alt="cancel sign"
                    width="40"
                    height="40"
                  />
                )
              ) : (
                "?"
              )}
            </div>
          </div>
          {eveActive && (
            <div className="nodeGroup2">
              <Computer
                role="Eve"
                color="red"
                current_basis={current?.after_eve?.basis}
              />
              <div
                className="basisLabel"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>Basis:</span>
                {current?.after_eve?.basis ? (
                  current.after_eve.basis === "Z" ? (
                    <img
                      src={plusSign}
                      alt="plus sign"
                      width="40"
                      height="40"
                    />
                  ) : (
                    <img
                      src={cancelSign}
                      alt="cancel sign"
                      width="40"
                      height="40"
                    />
                  )
                ) : (
                  "?"
                )}
              </div>
            </div>
          )}

          <div className="nodeGroup3">
            <Computer role="Receiver" current_basis={current?.bob?.basis} />
            <div
              className="basisLabel"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>Basis:</span>
              {current?.bob?.basis ? (
                current.bob.basis === "Z" ? (
                  <img src={plusSign} alt="plus sign" width="40" height="40" />
                ) : (
                  <img
                    src={cancelSign}
                    alt="cancel sign"
                    width="40"
                    height="40"
                  />
                )
              ) : (
                "?"
              )}
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
                  {eveActive && <th>Eve Bit</th>}
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
                    {/* {console.log(row.eveBit)} */}
                    {eveActive && (
                      <td
                        style={{
                          color: row.aliceBit == row.eveBit ? "black" : "red",
                        }}
                      >
                        {row.eveBit}
                      </td>
                    )}
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
              {(qber !== "0.00") && <button
                onClick={() => setShowCorrected(true)}
                className="correctBtn"
              >
                Show Corrected Key
              </button>}
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
      <div className="outerstyling">
        <div className="secureMessaging">
          <div className="centre">
            <h2 className="title">Secure Messaging Demo</h2>

            <div className="methodSelect">
              <label className="methodLabel">Encryption Method</label>
              <select
                className="methodDropdown"
                value={encryptionMethod}
                onChange={(e) => setEncryptionMethod(e.target.value)}
              >
                <option value="XOR">XOR</option>
                <option value="AES">AES</option>
              </select>
            </div>
          </div>

          <div className="securePanel">
            {/* Sender */}
            <div className="card secureCard">
              <div className="cardHeader">
                <div className="title">Sender</div>
              </div>
              <textarea
                placeholder="Enter message"
                value={senderMessage}
                onChange={(e) => setSenderMessage(e.target.value)}
              />
              <div className="siftedKeyBox">
                <b>Sifted Key (From Simulation):</b>
                <div className="siftedKeyValue">
                  {senderKey || "No key generated yet"}
                </div>
              </div>
              <button onClick={handleEncrypt}>Encrypt</button>
              <div className="outputBlock">
                <b>Encrypted Data:</b>
                <textarea readOnly value={encryptedMessage} />
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(encryptedMessage)
                  }
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Receiver */}
            <div className="card secureCard">
              <div className="cardHeader">
                <div className="title">Receiver</div>
              </div>
              <textarea
                placeholder="Paste encrypted message"
                value={receiverMessage}
                onChange={(e) => setReceiverMessage(e.target.value)}
              />
              <div className="siftedKeyBox">
                <b>Sifted Key (Editable):</b>
                <input
                  type="text"
                  value={receiverKey}
                  onChange={(e) => setReceiverKey(e.target.value)}
                  placeholder="Enter sifted key"
                />
              </div>
              <button onClick={handleDecrypt}>Decrypt</button>
              <div className="outputBlock">
                <b>Decrypted Data:</b>
                <textarea readOnly value={decryptedMessage} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
