import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070b14] py-8 text-center text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <p className="font-semibold text-slate-300">
            CAPITAL RUSH — IIIT KOTTAYAM
          </p>
          <p className="text-slate-500">
            Organized by Finance & E-Cell, Indian Institute of Information Technology Kottayam
          </p>
        </div>
        <div className="text-amber-400/80 font-medium tracking-wide">
          Think. Invest. Risk. Negotiate. Win.
        </div>
        <div className="text-slate-500">
          Simulation Platform • Live Event Engine
        </div>
      </div>
    </footer>
  );
}
