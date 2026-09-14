import React from 'react';
import { X, Download, QrCode, Shield } from 'lucide-react';

export default function QRDisplayModal({ team, isOpen, onClose }) {
  if (!isOpen || !team) return null;

  const downloadQR = () => {
    if (!team.qrCode) return;
    const link = document.createElement('a');
    link.href = team.qrCode;
    link.download = `${team.teamId}_${team.name.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2 text-amber-400">
          <QrCode className="w-6 h-6" />
          <h3 className="font-display font-bold text-lg text-white">Official Team QR</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Scan to identify team for scoring and negotiation transfers
        </p>

        {/* QR Frame */}
        <div className="bg-white p-4 rounded-xl shadow-inner inline-block mx-auto mb-4">
          {team.qrCode ? (
            <img
              src={team.qrCode}
              alt={`QR Code for ${team.name}`}
              className="w-56 h-56 mx-auto object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
              QR Code generating...
            </div>
          )}
        </div>

        {/* Details Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 mb-5 text-center">
          <div className="text-base font-bold text-white">{team.name}</div>
          <div className="inline-block mt-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded">
            ID: {team.teamId}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={downloadQR}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" /> Download QR Code
        </button>
      </div>
    </div>
  );
}
