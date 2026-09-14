import React, { useState } from 'react';
import { X, ArrowRightLeft, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, QrCode } from 'lucide-react';
import { lookupTeamForTransfer, executeRound3Transfer } from '../services/api';
import QRScannerModal from './QRScannerModal';

export default function Round3TransferModal({ myTeam, isOpen, onClose, onTransferred }) {
  const [step, setStep] = useState(1); // 1 = Lookup/Input, 2 = Mandatory Confirmation
  const [recipientTeamId, setRecipientTeamId] = useState('');
  const [recipientTeam, setRecipientTeam] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [amount, setAmount] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !myTeam) return null;

  const numAmount = parseInt(amount) || 0;
  const myCurrentCapital = myTeam.currentCapital;
  const myNewBalance = myCurrentCapital - numAmount;
  const recipientCurrentCapital = recipientTeam?.currentCapital || 0;
  const recipientNewBalance = recipientCurrentCapital + numAmount;

  const handleLookup = async (teamIdToLookup) => {
    const id = (teamIdToLookup || recipientTeamId).trim().toUpperCase();
    if (!id) return;

    if (id === myTeam.teamId.toUpperCase()) {
      setError('Cannot transfer money to your own team.');
      setRecipientTeam(null);
      return;
    }

    setLookingUp(true);
    setError('');
    try {
      const res = await lookupTeamForTransfer(id);
      if (res.success && res.team) {
        setRecipientTeam(res.team);
        setRecipientTeamId(id);
      }
    } catch (err) {
      setError(err.message || 'Recipient team not found.');
      setRecipientTeam(null);
    } finally {
      setLookingUp(false);
    }
  };

  const handleQRScanned = (scannedId) => {
    setRecipientTeamId(scannedId);
    setScannerOpen(false);
    handleLookup(scannedId);
  };

  const handleProceedToConfirmation = (e) => {
    e.preventDefault();
    setError('');

    const isEliminated = myCurrentCapital < 1000 || myTeam.status === 'DISQUALIFIED' || myTeam.status === 'ELIMINATED';
    if (isEliminated) {
      setError('Your team has been eliminated (Capital below ₹1,000) and cannot perform transfers.');
      return;
    }

    if (!recipientTeam) {
      setError('Please search and verify a valid recipient team first.');
      return;
    }

    if (recipientTeam.currentCapital < 1000 || recipientTeam.status === 'DISQUALIFIED' || recipientTeam.status === 'ELIMINATED') {
      setError('Recipient team has been eliminated (< ₹1,000) and cannot receive funds.');
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than ₹0.');
      return;
    }

    if (myNewBalance < 1000) {
      setError(`Tournament Survival Rule: Transferring ₹${numAmount.toLocaleString('en-IN')} would reduce your balance to ₹${myNewBalance.toLocaleString('en-IN')}. Dropping below ₹1,000 causes immediate team elimination! Maximum allowable transfer: ₹${Math.max(0, myCurrentCapital - 1000).toLocaleString('en-IN')}.`);
      return;
    }

    if (numAmount > myCurrentCapital) {
      setError(`Insufficient balance. You cannot transfer ₹${numAmount.toLocaleString('en-IN')}; current balance is ₹${myCurrentCapital.toLocaleString('en-IN')}.`);
      return;
    }

    setStep(2); // Mandatory confirmation step
  };

  const handleConfirmTransfer = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await executeRound3Transfer(recipientTeam.teamId, numAmount);
      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          onTransferred();
          handleClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setRecipientTeamId('');
    setRecipientTeam(null);
    setAmount('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 my-6">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <ArrowRightLeft className="w-6 h-6" />
            <h3 className="font-display font-bold text-xl text-white">
              Round 3: Transfer Money
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Direct peer-to-peer negotiation transfers between active teams
          </p>

          {step === 1 ? (
            /* STEP 1: Select Team & Amount */
            <form onSubmit={handleProceedToConfirmation} className="space-y-4">
              {/* Sender Info Banner */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">From (Your Team)</div>
                  <div className="text-sm font-bold text-white">{myTeam.name} ({myTeam.teamId})</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Available Capital</div>
                  <div className="text-base font-mono font-bold text-emerald-400">
                    ₹{myCurrentCapital.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Recipient Team Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Recipient Team
                  </label>
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan Recipient QR
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Recipient Team ID (e.g. CR-002)"
                    value={recipientTeamId}
                    onChange={(e) => {
                      setRecipientTeamId(e.target.value);
                      setRecipientTeam(null);
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono uppercase text-sm focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookup()}
                    disabled={lookingUp || !recipientTeamId.trim()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition"
                  >
                    {lookingUp ? 'Verifying...' : 'Verify Team'}
                  </button>
                </div>
              </div>

              {/* Verified Recipient Card */}
              {recipientTeam && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Recipient
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">{recipientTeam.name}</div>
                      <div className="text-xs font-mono text-slate-400">ID: {recipientTeam.teamId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Current Balance</div>
                      <div className="text-sm font-mono font-bold text-slate-200">
                        ₹{recipientCurrentCapital.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Transfer Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="100"
                    min="1"
                    max={myCurrentCapital}
                    placeholder="Enter amount to negotiate/transfer"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-base focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Next Step Button */}
              <button
                type="submit"
                disabled={!recipientTeam || numAmount <= 0 || numAmount > myCurrentCapital}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: MANDATORY CONFIRMATION SCREEN */
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Mandatory Transfer Confirmation
                </div>
                <p className="text-xs text-slate-300">
                  Transfers are irreversible once executed. Verify both parties and post-transfer balances below.
                </p>
              </div>

              {/* Transfer Details Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Transfer Amount:</span>
                  <span className="text-xl font-mono font-black text-amber-400">
                    ₹{numAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Sender Breakdown */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-400">Sender ({myTeam.name}):</div>
                    <div className="font-mono text-slate-500">Current: ₹{myCurrentCapital.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400">Balance After Transfer:</div>
                    <div className="font-mono font-bold text-rose-400">₹{myNewBalance.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Receiver Breakdown */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                  <div>
                    <div className="text-slate-400">Receiver ({recipientTeam.name}):</div>
                    <div className="font-mono text-slate-500">Current: ₹{recipientCurrentCapital.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400">Balance After Transfer:</div>
                    <div className="font-mono font-bold text-emerald-400">₹{recipientNewBalance.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTransfer}
                  disabled={loading}
                  className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 text-sm"
                >
                  {loading ? 'Transferring...' : 'CONFIRM TRANSFER'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipient QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQRScanned}
        title="Scan Recipient Team QR"
      />
    </>
  );
}
