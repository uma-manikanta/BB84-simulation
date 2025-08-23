
// import React, { useState, useEffect, useRef } from "react";
// import "./styles.css";
// import { motion } from "framer-motion";
// import { response } from "../data.js";

// // Utility for gradient id
// const makeGradId = (role) => `grad-${role}-${Math.random()}`;

// const Computer = ({ role = "Alice" }) => {
//   const gradId = makeGradId(role);
//   return (
//     <div className="computerWrapper">
//       <svg width="90" height="70" viewBox="0 0 160 120" className="drop-shadow">
//         <defs>
//           <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="1">
//             <stop offset="0%" stopColor="#cbd5e1" />
//             <stop offset="100%" stopColor="#94a3b8" />
//           </linearGradient>
//         </defs>
//         <rect
//           x="10"
//           y="10"
//           width="140"
//           height="85"
//           rx="10"
//           fill={`url(#${gradId})`}
//           stroke="#0f172a"
//           strokeWidth="3"
//         />
//         <rect x="22" y="22" width="116" height="60" rx="6" fill="#0b1020" />
//         <rect x="55" y="100" width="50" height="8" rx="2" fill="#0f172a" />
//         <rect x="35" y="108" width="90" height="6" rx="3" fill="#1f2937" />
//       </svg>
//       <span className="roleLabel">{role}</span>
//     </div>
//   );
// };

// const obj = JSON.parse(response);

// export default function AnimationDiv() {
//   const [index, setIndex] = useState(0);
//   const [logs, setLogs] = useState([]);
//   const [qber, setQber] = useState(0);
//   const [siftedKey, setSiftedKey] = useState([]);

//   const [duration, setDuration] = useState(2400);
//   const [circleBit, setCircleBit] = useState(obj[0].alice.bit);
//   const [circleColor, setCircleColor] = useState("rgb(119,56,236)");
//   const [isShocked, setIsShocked] = useState(false);

//   const [isRunning, setIsRunning] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const timersRef = useRef([]);

//   const current = obj[index];

//   // Update log + sifted key + QBER
//   useEffect(() => {
//     if (!isRunning) return;
//     const data = obj[index];

//     const outcome =
//       data.alice.basis === data.bob.basis
//         ? data.alice.bit === data.bob.measured_bit
//           ? "keep"
//           : "tampered"
//         : "discard";

//     let logRow = {
//       aliceBit: data.alice.bit,
//       aliceBase: data.alice.basis,
//       bobBase: data.bob.basis,
//       bobBit: data.bob.measured_bit,
//       outcome,
//     };
//     setLogs((prev) => [logRow, ...prev].slice(0, 12));

//     // QBER (mismatches/total)
//     let total = Object.keys(obj).length;
//     let mismatches = Object.values(obj).filter(
//       (item) => item.alice.bit !== item.bob.measured_bit
//     ).length;
//     setQber(((mismatches / total) * 100).toFixed(2));

//     // Sifted key
//     if (outcome === "keep" || outcome === "tampered") {
//       setSiftedKey((prev) => [
//         ...prev,
//         {
//           bit: data.bob.measured_bit,
//           correct: data.alice.bit === data.bob.measured_bit,
//         },
//       ]);
//     }
//   }, [index, isRunning]);

//   // Animation events
//   useEffect(() => {
//     if (!isRunning || isPaused) return;

//     const data = obj[index];
//     setCircleBit(data.alice.bit);
//     setCircleColor("rgb(119,56,236)");
//     setIsShocked(false);

//     timersRef.current.push(
//       setTimeout(() => {
//         if (data.is_eve_flipped) {
//           setCircleBit(data.after_eve.bit);
//           setCircleColor("red");
//         }
//       }, duration * 0.5)
//     );

//     timersRef.current.push(
//       setTimeout(() => {
//         if (data.is_noise_flipped) {
//           setCircleBit((prev) => (prev === 0 ? 1 : 0));
//           setCircleColor("orange");
//           setIsShocked(true);
//           setTimeout(() => setIsShocked(false), 600);
//         }
//       }, duration * 0.8)
//     );

//     timersRef.current.push(
//       setTimeout(() => {
//         setIndex((prev) => (prev + 1) % Object.keys(obj).length);
//       }, duration + 400)
//     );

//     return () => {
//       timersRef.current.forEach(clearTimeout);
//       timersRef.current = [];
//     };
//   }, [index, isRunning, isPaused, duration]);

//   // Controls
//   const handleStart = () => {
//     setLogs([]);
//     setSiftedKey([]);
//     setIndex(0);
//     setIsRunning(true);
//     setIsPaused(false);
//   };
//   const handlePause = () => {
//     setIsPaused(true);
//     timersRef.current.forEach(clearTimeout);
//   };
//   const handleResume = () => setIsPaused(false);
//   const handleReset = () => {
//     setIsRunning(false);
//     setIsPaused(false);
//     setIndex(0);
//     setCircleBit(obj[0].alice.bit);
//     setCircleColor("rgb(119,56,236)");
//     setIsShocked(false);
//     setLogs([]);
//     setSiftedKey([]);
//     setQber(0);
//     timersRef.current.forEach(clearTimeout);
//     timersRef.current = [];
//   };

//   return (
//     <div className="pageWrapper">
//       {/* Top Bar */}
//       <div className="topBar">
//         <h1 className="title">BB84 Protocol Simulation</h1>
//         <div className="controls">
//           <button onClick={handleStart}>Start</button>
//           <button onClick={handlePause} disabled={!isRunning || isPaused}>
//             Pause
//           </button>
//           <button onClick={handleResume} disabled={!isPaused}>
//             Resume
//           </button>
//           <button onClick={handleReset}>Reset</button>
//           <label>
//             Duration (ms):
//             <input
//               type="number"
//               value={duration}
//               onChange={(e) => setDuration(Number(e.target.value))}
//               min="500"
//               step="100"
//             />
//           </label>
//         </div>
//       </div>

//       {/* Main Animation */}
//       <div className="animationPanel">
//         <div className="lane">
//           {isRunning && !isPaused && (
//             <motion.div
//               className={`laneCircle ${isShocked ? "shock" : ""}`}
//               key={index}
//               initial={{ left: 0 }}
//               animate={{ left: ["0%", "50%", "95%"] }}
//               transition={{
//                 duration: duration / 1000,
//                 ease: "linear",
//                 times: [0, 0.5, 1],
//               }}
//               style={{
//                 backgroundColor: isShocked ? "orange" : circleColor,
//               }}
//             >
//               {circleBit}
//             </motion.div>
//           )}
//         </div>

//         {/* Nodes */}
//         <div className="nodePanel">
//           <Computer role="Alice" />
//           <div className="node">
//             <div className="nodeIcon">🕵️</div>
//             <p className="nodeTitle">Eve</p>
//             {current.is_eve_flipped && (
//               <small className="eveFlip">
//                 Flipped → {current.after_eve.bit}
//               </small>
//             )}
//           </div>
//           <Computer role="Bob" />
//         </div>
//       </div>

//       {/* Logs + Sifted Key UI */}
//       <div className="bottomPanel">
//         {/* Transmission log card */}
//         <div className="card">
//           <div className="cardHeader">
//             <div className="title">Transmission log</div>
//             <div className="value">
//               QBER: <span>{qber}%</span>
//             </div>
//           </div>

//           <div className="logTableWrapper">
//             <table className="logTable">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>A bit</th>
//                   <th>A basis</th>
//                   <th>B basis</th>
//                   <th>B bit</th>
//                   <th>Outcome</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {logs.map((row, i) => (
//                   <tr key={i}>
//                     <td>{i + 1}</td>
//                     <td>
//                       <b>{row.aliceBit}</b>
//                     </td>
//                     <td>{row.aliceBase}</td>
//                     <td>{row.bobBase}</td>
//                     <td>{row.bobBit ?? "–"}</td>
//                     <td>
//                       {row.outcome === "keep" ? (
//                         <span className="outcome-keep">keep</span>
//                       ) : row.outcome === "discard" ? (
//                         <span className="outcome-discard">discard</span>
//                       ) : (
//                         <span className="outcome-tampered">tampered</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Sifted key card */}
//         <div className="card">
//           <div className="cardHeader">
//             <div className="title">Sifted key (kept bits)</div>
//             <div className="value">
//               Kept: <span>{siftedKey.length}</span>
//             </div>
//           </div>

//           <div className="siftedContainer">
//             {siftedKey.length === 0 ? (
//               <div className="siftedEmpty">No bits kept yet…</div>
//             ) : (
//               siftedKey.map((b, i) => (
//                 <div
//                   key={i}
//                   className={`siftedBit ${b.correct ? "keep" : "error"}`}
//                 >
//                   {b.bit}
//                 </div>
//               ))
//             )}
//           </div>

//           <div className="siftedNote">
//             QBER is computed as the fraction of mismatches among kept bits.
//             Elevated QBER indicates Eve or noise.
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect, useRef } from "react";
// import "./styles.css";
// import { motion } from "framer-motion";

// // Utility for gradient id
// const makeGradId = (role) => `grad-${role}-${Math.random()}`;

// const Computer = ({ role = "Sender", color = "default" }) => {
//   const gradId = makeGradId(role);
//   let stop1 = "#cbd5e1";
//   let stop2 = "#94a3b8";
//   if (color === "red") {
//     stop1 = "#f87171";
//     stop2 = "#dc2626";
//   }
//   return (
//     <div className="computerWrapper">
//       <svg width="90" height="70" viewBox="0 0 160 120" className="drop-shadow">
//         <defs>
//           <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="1">
//             <stop offset="0%" stopColor={stop1} />
//             <stop offset="100%" stopColor={stop2} />
//           </linearGradient>
//         </defs>
//         <rect
//           x="10"
//           y="10"
//           width="140"
//           height="85"
//           rx="10"
//           fill={`url(#${gradId})`}
//           stroke="#0f172a"
//           strokeWidth="3"
//         />
//         <rect x="22" y="22" width="116" height="60" rx="6" fill="#0b1020" />
//         <rect x="55" y="100" width="50" height="8" rx="2" fill="#0f172a" />
//         <rect x="35" y="108" width="90" height="6" rx="3" fill="#1f2937" />
//       </svg>
//       <span className="roleLabel">{role}</span>
//     </div>
//   );
// };

// export default function AnimationDiv() {
//   const [index, setIndex] = useState(0);
//   const [logs, setLogs] = useState([]);
//   const [qber, setQber] = useState(null);
//   const [siftedKey, setSiftedKey] = useState([]);
//   const [correctedKey, setCorrectedKey] = useState(null);
//   const [showCorrected, setShowCorrected] = useState(false);

//   const [duration, setDuration] = useState(2400);
//   const [circleBit, setCircleBit] = useState(null);
//   const [circleColor, setCircleColor] = useState("rgb(119,56,236)");
//   const [isShocked, setIsShocked] = useState(false);

//   const [isRunning, setIsRunning] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const timersRef = useRef([]);

//   // Parameters for backend
//   const [keyLength, setKeyLength] = useState(10);
//   const [eveActive, setEveActive] = useState(false);
//   const [noisePercent, setNoisePercent] = useState(10);

//   // Simulation data from backend
//   const [obj, setObj] = useState([]);
//   const current = obj[index] || {};

//   // Fetch simulation data from backend
//   const fetchData = async () => {
//   try {
//     const res = await fetch(
//       `http://127.0.0.1:8000/?KEY_LENGTH=${keyLength}&is_eve_active=${eveActive}&noise_percent=${noisePercent}`
//     );
//     const raw = await res.json();
//     const data = JSON.parse(raw); // <-- here’s the part
//     const details = Object.values(data.log_details);
//     setObj(details);
//     setQber(data.qber);
//     setSiftedKey([]);
//     setCircleBit(details[0]?.alice?.bit ?? 0);
//   } catch (err) {
//     console.error("Error fetching data:", err);
//   }
// };
// // Update logs + sifted key
// useEffect(() => {
//   if (!isRunning || obj.length === 0) return;
//   const data = obj[index];

//   const outcome =
//     data.alice.basis === data.bob.basis
//       ? data.alice.bit === data.bob.measured_bit
//         ? "keep"
//         : "tampered"
//       : "discard";

//   // Update transmission log
//   let logRow = {
//     aliceBit: data.alice.bit,
//     aliceBase: data.alice.basis,
//     bobBase: data.bob.basis,
//     bobBit: data.bob.measured_bit,
//     outcome,
//   };
//   setLogs((prev) => [logRow, ...prev].slice(0, 12));

//   // Update sifted key
//   if (outcome === "keep" || outcome === "tampered") {
//     setSiftedKey((prev) => [
//       ...prev,
//       {
//         bit: data.bob.measured_bit,
//         correct: data.alice.bit === data.bob.measured_bit,
//       },
//     ]);
//   }
// }, [index, isRunning, obj]);


//   // Update logs + sifted key
//   // Animation events
// useEffect(() => {
//   if (!isRunning || isPaused || obj.length === 0) return;

//   const data = obj[index];
//   setCircleBit(data.alice.bit);
//   setCircleColor("rgb(119,56,236)");
//   setIsShocked(false);

//   // Eve flip
//   timersRef.current.push(
//     setTimeout(() => {
//       if (data.is_eve_flipped) {
//         setCircleBit(data.after_eve.bit);
//         setCircleColor("red");
//       }
//     }, duration * 0.5)
//   );

//   // Noise flip
//   timersRef.current.push(
//     setTimeout(() => {
//       if (data.is_noise_flipped) {
//         setCircleBit((prev) => (prev === 0 ? 1 : 0));
//         setCircleColor("orange");
//         setIsShocked(true);
//         setTimeout(() => setIsShocked(false), 600);
//       }
//     }, duration * 0.8)
//   );

//   // Move to next bit or finish
//   if (index < obj.length - 1) {
//     timersRef.current.push(
//       setTimeout(() => {
//         setIndex((prev) => prev + 1);
//       }, duration + 400)
//     );
//   } else {
//     timersRef.current.push(
//       setTimeout(() => {
//         setIsRunning(false);
//         let total = siftedKey.length;
//         let mismatches = siftedKey.filter((b) => !b.correct).length;
//         setQber(((mismatches / total) * 100).toFixed(2));

//         // ✅ build corrected key only if Eve is inactive
//         if (!eveActive && total > 0) {
//           setCorrectedKey(
//             siftedKey.map((b) =>
//               b.correct ? b.bit : (b.bit ^ 1) // flip wrong bits
//             )
//           );
//         }
//       }, duration + 400)
//     );
//   }

//   return () => {
//     timersRef.current.forEach(clearTimeout);
//     timersRef.current = [];
//   };
// }, [index, isRunning, isPaused, duration, obj, siftedKey, eveActive]);


//   // Animation events
//   useEffect(() => {
//     if (!isRunning || isPaused || obj.length === 0) return;

//     const data = obj[index];
//     setCircleBit(data.alice.bit);
//     setCircleColor("rgb(119,56,236)");
//     setIsShocked(false);

//     timersRef.current.push(
//       setTimeout(() => {
//         if (data.is_eve_flipped) {
//           setCircleBit(data.after_eve.bit);
//           setCircleColor("red");
//         }
//       }, duration * 0.5)
//     );

//     timersRef.current.push(
//       setTimeout(() => {
//         if (data.is_noise_flipped) {
//           setCircleBit((prev) => (prev === 0 ? 1 : 0));
//           setCircleColor("orange");
//           setIsShocked(true);
//           setTimeout(() => setIsShocked(false), 600);
//         }
//       }, duration * 0.8)
//     );

//     if (index < obj.length - 1) {
//       timersRef.current.push(
//         setTimeout(() => {
//           setIndex((prev) => prev + 1);
//         }, duration + 400)
//       );
//     } else {
//       timersRef.current.push(
//         setTimeout(() => {
//           setIsRunning(false);
//           let total = siftedKey.length;
//           let mismatches = siftedKey.filter((b) => !b.correct).length;
//           setQber(((mismatches / total) * 100).toFixed(2));
//         }, duration + 400)
//       );
//     }

//     return () => {
//       timersRef.current.forEach(clearTimeout);
//       timersRef.current = [];
//     };
//   }, [index, isRunning, isPaused, duration, obj, siftedKey]);

//   // Controls
//   const handleStart = async () => {
//     setLogs([]);
//     setSiftedKey([]);
//     setCorrectedKey(null);
//     setShowCorrected(false);
//     setIndex(0);
//     await fetchData();
//     setIsRunning(true);
//     setIsPaused(false);
//   };

//   return (
//     <div className="pageWrapper">
//       {/* Controls */}
//       <div className="topBar">
//         <h1 className="title">BB84 Protocol Simulation</h1>
//         <div className="controls">
//           <button onClick={handleStart}>Start</button>
//           <button
//             onClick={() => setIsPaused(true)}
//             disabled={!isRunning || isPaused}
//           >
//             Pause
//           </button>
//           <button
//             onClick={() => setIsPaused(false)}
//             disabled={!isPaused}
//           >
//             Resume
//           </button>
//           <button onClick={() => window.location.reload()}>Reset</button>
//           <label>
//             Duration (ms):
//             <input
//               type="number"
//               value={duration}
//               onChange={(e) => setDuration(Number(e.target.value))}
//               min="500"
//               step="100"
//             />
//           </label>
//           <label>
//             Key length:
//             <input
//               type="number"
//               value={keyLength}
//               onChange={(e) => setKeyLength(Number(e.target.value))}
//               min="1"
//             />
//           </label>
//           <label>
//             Eve active:
//             <input
//               type="checkbox"
//               checked={eveActive}
//               onChange={(e) => setEveActive(e.target.checked)}
//             />
//           </label>
//           <label>
//             Noise %: {noisePercent}%
//             <input
//               type="range"
//               value={noisePercent}
//               onChange={(e) => setNoisePercent(Number(e.target.value))}
//               min="1"
//               max="100"
//             />
//           </label>
//         </div>
//       </div>

//       {/* Lane */}
//       <div className="animationPanel">
//         <div className="lane">
//           {isRunning && !isPaused && circleBit !== null && (
//             <motion.div
//               className={`laneCircle ${isShocked ? "shock" : ""}`}
//               key={index}
//               initial={{ left: "0%" }}
//               animate={{ left: "95%" }}
//               transition={{
//                 duration: duration / 1000,
//                 ease: "linear",
//               }}
//               style={{
//                 backgroundColor: isShocked ? "orange" : circleColor,
//               }}
//             >
//               {circleBit}
//             </motion.div>
//           )}
//         </div>

//         {/* Nodes with basis below */}
//         <div className="nodePanel">
//           <div className="nodeGroup">
//             <Computer role="Sender" />
//             <div className="basisLabel">
//               Basis: {current?.alice?.basis ?? "–"}
//             </div>
//             {/* Basis match results bar below sender */}
           
//           </div>
//           <div className="nodeGroup">
//             <Computer role="Eve" color="red" />
//             <div className="basisLabel">
//               Basis: {current?.after_eve?.basis ?? "–"}
//             </div>
//           </div>
//           <div className="nodeGroup">
//             <Computer role="Receiver" />
//             <div className="basisLabel">
//               Basis: {current?.bob?.basis ?? "–"}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Bottom Panel */}
//       <div className="bottomPanel">
//         {/* Transmission log */}
//         <div className="card">
//           <div className="cardHeader">
//             <div className="title">Transmission log</div>
//             <div className="value">
//               QBER: <span>{qber !== null ? `${qber}%` : "…"}</span>
//             </div>
//           </div>
//           <div className="logTableWrapper">
//             <table className="logTable">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Sender bit</th>
//                   <th>Sender basis</th>
//                   <th>Receiver basis</th>
//                   <th>Receiver bit</th>
//                   <th>Outcome</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {logs.map((row, i) => (
//                   <tr key={i}>
//                     <td>{i + 1}</td>
//                     <td><b>{row.aliceBit}</b></td>
//                     <td>{row.aliceBase}</td>
//                     <td>{row.bobBase}</td>
//                     <td>{row.bobBit ?? "–"}</td>
//                     <td>
//                       {row.outcome === "keep" ? (
//                         <span className="outcome-keep">keep</span>
//                       ) : row.outcome === "discard" ? (
//                         <span className="outcome-discard">discard</span>
//                       ) : (
//                         <span className="outcome-tampered">tampered</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Sifted key */}
//         <div className="card">
//           <div className="cardHeader">
//             <div className="title">Sifted key (kept bits)</div>
//             <div className="value">
//               Kept: <span>{siftedKey.length}</span>
//             </div>
//           </div>
//           <div className="siftedContainer">
//             {siftedKey.length === 0 ? (
//               <div className="siftedEmpty">No bits kept yet…</div>
//             ) : (
//               siftedKey.map((b, i) => (
//                 <div
//                   key={i}
//                   className={`siftedBit ${b.correct ? "keep" : "error"}`}
//                 >
//                   {b.bit}
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Corrected key logic */}
//           {!isRunning && correctedKey && !eveActive && qber > 0 && (
//             <>
//               <button
//                 onClick={() => setShowCorrected(true)}
//                 className="correctBtn"
//               >
//                 Show Corrected Key
//               </button>
//               {showCorrected && (
//                 <div className="correctedKeyDisplay">
//                   Corrected Key: {correctedKey.join("")}
//                 </div>
//               )}
//             </>
//           )}

//           <div className="siftedNote">
//             QBER is shown after animation finishes. Corrected key is only
//             available when errors are from noise (not Eve).
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
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

  const [duration, setDuration] = useState(2400);
  const [circleBit, setCircleBit] = useState(null);
  const [circleColor, setCircleColor] = useState("rgb(119,56,236)");
  const [isShocked, setIsShocked] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timersRef = useRef([]);

  // Parameters for backend
  const [keyLength, setKeyLength] = useState(10);
  const [eveActive, setEveActive] = useState(false);
  const [noisePercent, setNoisePercent] = useState(10);
  const [status, setStatus] = useState(""); 
  const [aftereve, setaftereve] = useState(""); 

  // Simulation data from backend
  const [obj, setObj] = useState([]);
  const current = obj[index] || {};

  // Fetch simulation data from backend
  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/?KEY_LENGTH=${keyLength}&is_eve_active=${eveActive}&noise_percent=${noisePercent}`
      );
      const raw = await res.json();
      const data = JSON.parse(raw); // backend is double-encoding JSON
      const details = Object.values(data.log_details);
      setObj(details);
      console.log(details);
      setQber(data.qber);
      setSiftedKey([]);
      setCircleBit(details[0]?.alice?.bit ?? 0);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // ✅ Update logs + sifted key
  useEffect(() => {
    if (!isRunning || obj.length === 0) return;
    const data = obj[index];

    const outcome =
      data.alice.basis === data.bob.basis
        ? data.alice.bit === data.bob.measured_bit
          ? "keep"
          : "tampered"
        : "discard";

    let logRow = {
      aliceBit: data.alice.bit,
      aliceBase: data.alice.basis,
      bobBase: data.bob.basis,
      bobBit: data.bob.measured_bit,
      outcome,
    };
    setLogs((prev) => [logRow, ...prev]);

    if (outcome === "keep" || outcome === "tampered") {
      setSiftedKey((prev) => [
        ...prev,
        {
          bit: data.bob.measured_bit,
          correct: data.alice.bit === data.bob.measured_bit,
        },
      ]);
    }
  }, [index, isRunning, obj]);

  // ✅ Animation events
  useEffect(() => {
    if (!isRunning || isPaused || obj.length === 0) return;
    if(eveActive){
       setaftereve("aftereve")
    }
    const data = obj[index];
    setCircleBit(data.alice.bit);
    setCircleColor("rgb(119,56,236)");
    setIsShocked(false);
    setStatus("");
    // Eve flip
    timersRef.current.push(
      setTimeout(() => {
        if (data.is_eve_flipped) {
          setCircleBit(data.after_eve.bit);
          setCircleColor("red");
        }
      }, duration * 0.5)
    );
    //setting red color when mismatches
    timersRef.current.push(
      setTimeout(() => {
        if (data.is_eve_flipped) {
          setStatus("mismatch");
        }
      }, duration)
    );
     timersRef.current.push(
      setTimeout(() => {
        if (data.is_noise_flipped) {
          setStatus("mismatch");
        }
      }, duration)
    );
     timersRef.current.push(
      setTimeout(() => {
        if (!data.is_eve_flipped && !data.is_noise_flipped) {
          setStatus("match");
        }
      }, duration)
    );
    // Noise flip
    timersRef.current.push(
      setTimeout(() => {
        if (data.is_noise_flipped) {
          setCircleBit((prev) => (prev === 0 ? 1 : 0));
          setCircleColor("orange");
          setIsShocked(true);
          setTimeout(() => setIsShocked(false), duration * 0.2);
        }
      }, duration * 0.8)
    );

    // Move to next bit or finish
    if (index < obj.length - 1) {
      timersRef.current.push(
        setTimeout(() => {
          setIndex((prev) => prev + 1);
        }, duration + 1000)
      );
    } else {
      timersRef.current.push(
        setTimeout(() => {
          setIsRunning(false);
          let total = siftedKey.length;
          let mismatches = siftedKey.filter((b) => !b.correct).length;
          setQber(((mismatches / total) * 100).toFixed(2));

          // build corrected key only if Eve is inactive
          if (!eveActive && total > 0) {
            setCorrectedKey(
              siftedKey.map((b) =>
                b.correct ? b.bit : (b.bit ^ 1) // flip wrong bits
              )
            );
          }
        }, duration + 400)
      );
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [index, isRunning, isPaused, duration, obj, siftedKey, eveActive]);

  // Controls
  const handleStart = async () => {
    setLogs([]);
    setSiftedKey([]);
    setCorrectedKey(null);
    setShowCorrected(false);
    setIndex(0);
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
          <button style={{ background: "#22c55e", color: "white" }} onClick={handleStart}>
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
            disabled={!isPaused}
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
              onChange={(e) => setDuration(Number(e.target.value))}
              min="500"
              step="100"
            />
          </label>
          <label className="label">
            Key length:
            <input
            className="keylengthInput"
              type="number"
              value={keyLength}
              onChange={(e) => setKeyLength(Number(e.target.value))}
              min="1"
            />
          </label>
          <label className="label">
            Eve active:
            <input
            className="eveActiveCheckbox"
              type="checkbox"
              checked={eveActive}
              onChange={(e) => {setEveActive(e.target.checked) ;
                setaftereve("aftereve");
                }}
              disabled={isRunning}  
              cursor={isRunning ?"nor allowed":"pointer"}
            />
          </label>
          <label className="label">
            Noise %: {noisePercent}%
            <input
            className="noiseInput"
              type="range"
              value={noisePercent}
              onChange={(e) => setNoisePercent(Number(e.target.value))}
              min="1"
              max="100"
            />
          </label>
        </div>
      </div>

      {/* Lane */}
      <div className="animationPanel">
        <div className={`circleouter ${aftereve}`}>
          <div className={`circle ${status} `}>
            <div className="wave"></div>
          </div>
            
        </div>
        <div className={`lane ${aftereve}`}>
         
          {circleBit !== null && (
            <motion.div
              className={`laneCircle ${isShocked ? "shock" : ""}`}
              key={index}
              initial={{ left: "0%" }}
              animate={isRunning && !isPaused ? { left: "95%" } : {}}
              transition={{
                duration: duration / 1000,
                ease: "linear",
              }}
              style={{
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
              Basis: {current?.alice?.basis ?? "–"}
            </div>
          </div>
          {eveActive &&(
            <div className="nodeGroup2">
            <Computer role="Eve" color="red" />
            <div className="basisLabel">
              Basis: {current?.after_eve?.basis ?? "–"}
            </div>
          </div>
          )}
          
          <div className="nodeGroup3">
            
            <Computer role="Receiver" />
            <div className="basisLabel">
              Basis: {current?.bob?.basis ?? "–"}
            
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
                  <th>Receiver basis</th>
                  <th>Receiver bit</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td><b>{row.aliceBit}</b></td>
                    <td>{row.aliceBase}</td>
                    <td>{row.bobBase}</td>
                    <td>{row.bobBit ?? "–"}</td>
                    <td>
                      {row.outcome === "keep" ? (
                        <span className="outcome-keep">keep</span>
                      ) : row.outcome === "discard" ? (
                        <span className="outcome-discard">discard</span>
                      ) : (
                        <span className="outcome-tampered">tampered</span>
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
                <div
                  key={i}
                  className={`siftedBit ${b.correct ? "keep" : "error"}`}
                >
                  {b.bit}
                </div>
              ))
            )}
          </div>

          {/* Corrected key */}
          {!isRunning && correctedKey && !eveActive && qber > 0 && (
            <>
              <button
                onClick={() => setShowCorrected(true)}
                className="correctBtn"
              >
                Show Corrected Key
              </button>
              {showCorrected && (
                <div className="correctedKeyDisplay">
                  Corrected Key: {correctedKey.join("")}
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




