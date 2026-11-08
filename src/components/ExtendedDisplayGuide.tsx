import React from 'react';
import { Monitor, Tv, ArrowRight, CheckCircle2, X } from 'lucide-react';

interface ExtendedDisplayGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtendedDisplayGuide: React.FC<ExtendedDisplayGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
          aria-label="Close setup guide"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400 font-cinzel">Single-Laptop Extended Display Setup</h2>
            <p className="text-xs text-slate-400">One laptop powers both the Admin controls and the Projector display simultaneously</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 text-sm">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-amber-300 font-semibold mb-2">
              <Monitor className="w-4 h-4" />
              <span>Laptop Built-in Screen</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Private Operator Control Panel</p>
            <div className="text-xs bg-slate-900 p-2 rounded font-mono text-amber-400/90 border border-slate-800">
              Open: /admin
            </div>
            <ul className="text-xs text-slate-300 mt-2 space-y-1">
              <li>• Private answer keys</li>
              <li>• Question & timer controls</li>
              <li>• Lifelines & FFF management</li>
            </ul>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-2">
              <Tv className="w-4 h-4" />
              <span>Projector (HDMI Out)</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Public KBC Show Presentation</p>
            <div className="text-xs bg-slate-900 p-2 rounded font-mono text-emerald-400/90 border border-slate-800">
              Open: /projector
            </div>
            <ul className="text-xs text-slate-300 mt-2 space-y-1">
              <li>• High-contrast TV graphics</li>
              <li>• QR code for 100+ participants</li>
              <li>• Full-screen presentation mode</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Step-by-Step Operator Checklist:</h3>
          <ol className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
              <span>Connect the projector to your laptop using an <strong>HDMI cable</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
              <span>Press <kbd className="bg-slate-800 px-1 rounded">Win + P</kbd> (Windows) or open <em>System Settings → Displays</em> (Mac) and choose <strong>Extend Display</strong> (do not use Mirror).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
              <span>Keep this <strong>/admin</strong> window on your laptop screen.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 text-[11px]">4</span>
              <span>Open a new browser window with <strong>/projector</strong> and drag that window to the extended projector screen.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 text-[11px]">5</span>
              <span>Press <kbd className="bg-slate-800 px-1 rounded">F11</kbd> on the projector window for <strong>Full Screen</strong>.</span>
            </li>
          </ol>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Got it, Display Configured</span>
          </button>
        </div>
      </div>
    </div>
  );
};
