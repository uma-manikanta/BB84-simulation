import React, { useState, useEffect, useRef } from "react";
import AnimationDiv from "./components/AnimationDiv";

 export default function App() {
    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-center mb-4">BB84 Qubit Transfer Animation</h1>
            <AnimationDiv />
        </div>
    );
}