import React, { useState } from 'react';
import { SenderConsole } from './components/SenderConsole';
import { ReceiverConsole } from './components/ReceiverConsole';
import { AppMode } from './types';
import { ShieldCheckIcon, SignalIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SENDER);

  return (
    <div className="min-h-screen bg-drdo-dark text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar / Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
               <ShieldCheckIcon className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tighter text-white font-mono">PROJECT <span className="text-emerald-500">KAVACH</span></h1>
               <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">Secure Steganographic Comms</p>
             </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 rounded border border-slate-700">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs font-mono text-emerald-500">LINK SECURE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Scenario Brief */}
        <div className="mb-8 bg-slate-900/50 border-l-4 border-emerald-600 p-4 rounded-r-lg">
           <p className="font-mono text-sm text-slate-400">
             <strong className="text-emerald-500">MISSION OBJECTIVE:</strong> Transmission of classified battle plans through hostile networks using AES-256 encryption disguised within innocuous image data.
           </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 mb-6 w-fit mx-auto md:mx-0">
           <button
             onClick={() => setMode(AppMode.SENDER)}
             className={`px-6 py-2 rounded-md text-sm font-mono font-bold transition-all ${
               mode === AppMode.SENDER 
                 ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700' 
                 : 'text-slate-500 hover:text-slate-300'
             }`}
           >
             SENDER CONSOLE
           </button>
           <button
             onClick={() => setMode(AppMode.RECEIVER)}
             className={`px-6 py-2 rounded-md text-sm font-mono font-bold transition-all ${
               mode === AppMode.RECEIVER 
                 ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700' 
                 : 'text-slate-500 hover:text-slate-300'
             }`}
           >
             RECEIVER CONSOLE
           </button>
        </div>

        {/* Dynamic View */}
        <div className="min-h-[500px]">
           {mode === AppMode.SENDER ? <SenderConsole /> : <ReceiverConsole />}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6 bg-slate-950">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs text-slate-600 font-mono">
              DRDO INTELLIGENCE DIVISION | AUTHORIZED PERSONNEL ONLY | AES-256-GCM + LSB
            </p>
         </div>
      </footer>
    </div>
  );
};

export default App;