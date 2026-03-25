import React from "react";

export function ShineBorder() {
  return (
    <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-300 via-indigo-300 to-pink-300 opacity-20 blur-xl animate-pulse"></div>
      <div className="absolute inset-0 rounded-2xl border border-white/20"></div>
    </div>
  );
}
