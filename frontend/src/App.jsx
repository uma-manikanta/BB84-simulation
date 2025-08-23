import React, { useState, useEffect, useRef } from "react";
import Controls from "./components/Controls";
import Transmission from "./components/Transmission";
import LogPanel from "./components/LogPanel";
import KeyPanel from "./components/KeyPanel";
import AnimationDiv from "./components/AnimationDiv";

export default function App() {
const [rounds, setRounds] = useState(14);
const [noise, setNoise] = useState(0);
const [eve, setEve] = useState(false);
const [speed, setSpeed] = useState(700);
const [data, setData] = useState(null);
const [index, setIndex] = useState(0);
const [playing, setPlaying] = useState(false);
const intervalRef = useRef(null);
const [outcomePulse, setOutcomePulse] = useState(null);


const startSimulation = async () => {
stopPlayback();
setData(null);
setIndex(0);
const res = await fetch("http://127.0.0.1:5000/run-bb84", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ rounds, noise, eve }),
});
const json = await res.json();
console.log(json);
setData(json);
setTimeout(() => setPlaying(true), 200);
};


const stopPlayback = () => {
setPlaying(false);
if (intervalRef.current) clearInterval(intervalRef.current);
};


const resetAll = () => {
stopPlayback();
setData(null);
setIndex(0);
setOutcomePulse(null);
};


useEffect(() => {
if (!playing || !data) return;
if (intervalRef.current) clearInterval(intervalRef.current);
intervalRef.current = setInterval(() => {
setIndex((i) => {
const next = i + 1;
if (next >= data.alice_bits.length) {
stopPlayback();
return i;
}
return next;
});
}, speed);
return () => clearInterval(intervalRef.current);
}, [playing, data, speed]);


useEffect(() => {
if (!data) return;
const i = index;
if (i >= data.alice_bits.length) return;
const aBit = data.alice_bits[i];
const bBit = data.bob_bits[i];
const aBasis = data.alice_bases[i];
const bBasis = data.bob_bases[i];
let outcome = "-";
if (aBasis === bBasis) outcome = aBit === bBit ? "match" : "mismatch";
setOutcomePulse(outcome);
const t = setTimeout(() => setOutcomePulse(null), Math.max(300, speed - 100));
return () => clearTimeout(t);
}, [index, data, speed]);


return (
<div className="min-h-screen bg-gray-100 p-6">
<h1 className="text-2xl font-bold text-center mb-4">BB84 Qubit Transfer Animation</h1>
{/* <Controls {...{ rounds, setRounds, noise, setNoise, eve, setEve, startSimulation, resetAll, playing, setPlaying, speed, setSpeed }} />
<Transmission {...{ data, index, outcomePulse, eve }} />
<div className="grid grid-cols-2 gap-4">
<LogPanel {...{ data, index }} />
<KeyPanel {...{ data }} />
</div> */}
<AnimationDiv />
</div>
);
}