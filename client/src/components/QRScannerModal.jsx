import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, AlertCircle } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess, title = "Scan Team QR Code" }) {
  const [manualId, setManualId] = useState('');
  const [useCamera, setUseCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (useCamera) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, useCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const qrRegionId = "qr-scanner-region";
      // Wait for DOM element
      setTimeout(async () => {
        const el = document.getElementById(qrRegionId);
        if (!el) return;

        try {
          const html5QrCode = new Html5Qrcode(qrRegionId);
          html5QrCodeRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // Successfully decoded
              const cleaned = decodedText.trim().toUpperCase();
              stopCamera();
              onScanSuccess(cleaned);
            },
            () => {
              // Ignore frame errors
            }
          );
        } catch (err) {
          console.warn("Camera start failed, falling back to manual entry:", err);
          setCameraError("Camera access unavailable or blocked. Please enter Team ID manually.");
          setUseCamera(false);
        }
      }, 300);
    } catch (err) {
      setCameraError("Unable to initialize camera.");
      setUseCamera(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // Ignore stop error
      }
      html5QrCodeRef.current = null;
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    const clean = manualId.trim().toUpperCase();
    stopCamera();
    onScanSuccess(clean);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3 className="font-display font-bold text-lg text-white mb-1 flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-400" />
          {title}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Point camera at the team's QR or switch to manual entry
        </p>

        {/* Toggle Mode */}
        <div className="flex bg-slate-800 p-1 rounded-xl mb-4">
          <button
            onClick={() => setUseCamera(true)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              useCamera ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" /> Camera Scanner
          </button>
          <button
            onClick={() => {
              stopCamera();
              setUseCamera(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              !useCamera ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Manual Entry
          </button>
        </div>

        {/* Camera View */}
        {useCamera ? (
          <div className="text-center">
            {cameraError && (
              <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
            <div
              id="qr-scanner-region"
              className="w-full bg-black rounded-xl overflow-hidden min-h-[260px] border border-slate-700 flex items-center justify-center"
            ></div>
            <p className="text-[11px] text-slate-500 mt-2">
              Align QR code inside the box to scan automatically
            </p>
          </div>
        ) : (
          /* Manual ID Entry Fallback */
          <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Team Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. CR-001"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-base tracking-widest uppercase focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualId.trim()}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
            >
              Confirm Team
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
