import React, { useState } from 'react';
import { ProcessingStatus, MediaType } from '../types';
import { decryptMessage } from '../services/crypto';
import { revealTextFromImage, revealTextFromAudio } from '../services/steganography';
import { LockOpenIcon, ArrowUpTrayIcon, ShieldCheckIcon, SpeakerWaveIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const ReceiverConsole: React.FC = () => {
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedType, setDetectedType] = useState<MediaType | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({ loading: false, message: '', type: 'idle' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      if (file.type.includes('audio') || file.name.endsWith('.wav')) {
        setDetectedType(MediaType.AUDIO);
      } else {
        setDetectedType(MediaType.IMAGE);
      }

      setDecryptedMessage(null);
      setStatus({ loading: false, message: '', type: 'idle' });
    }
  };

  const processDecryption = async () => {
    if (!password || !selectedFile) {
      setStatus({ loading: false, message: 'Missing fields.', type: 'error' });
      return;
    }

    setStatus({ loading: true, message: 'Scanning media for hidden artifacts...', type: 'info' });

    try {
      let encryptedBundle: string;
      
      if (detectedType === MediaType.AUDIO) {
        setStatus({ loading: true, message: 'Layer 2: Extracting binary from Audio LSB...', type: 'info' });
        encryptedBundle = await revealTextFromAudio(selectedFile);
      } else {
        // Image
        const img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        await new Promise((resolve) => { img.onload = resolve; });
        setStatus({ loading: true, message: 'Layer 2: Extracting binary from Image LSB...', type: 'info' });
        encryptedBundle = await revealTextFromImage(img);
      }

      // 3. Decrypt Data (Layer 1)
      setStatus({ loading: true, message: 'Layer 1: AES-256 decryption...', type: 'info' });
      await new Promise(r => setTimeout(r, 600)); // Suspense delay
      
      const message = await decryptMessage(encryptedBundle, password);

      setDecryptedMessage(message);
      setStatus({ loading: false, message: 'Message successfully intercepted.', type: 'success' });

    } catch (error) {
      setDecryptedMessage(null);
      const err = error as Error;
      
      if (err.message === "MESSAGE_EXPIRED") {
        setStatus({ loading: false, message: 'SELF-DESTRUCT SEQUENCE TRIGGERED', type: 'destruct' });
      } else if (err.message.includes("Wrong Security Key")) {
         setStatus({ loading: false, message: 'ACCESS DENIED: Incorrect Security Key.', type: 'error' });
      } else {
         setStatus({ loading: false, message: `Decryption Failed: ${err.message}`, type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`bg-drdo-card border p-6 rounded-lg shadow-xl relative overflow-hidden transition-colors duration-500
         ${status.type === 'destruct' ? 'border-red-600 shadow-red-900/50' : 'border-slate-700'}`}>
        
        {/* Decorative Radar Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent"></div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Inputs */}
          <div className="space-y-4">
             <div>
              <label className="block text-emerald-500 text-xs font-mono uppercase tracking-widest mb-2">
                // Received Stego-File
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:bg-slate-800/50 transition-colors text-center cursor-pointer relative h-32 flex items-center justify-center">
                <input 
                  type="file" 
                  accept="image/png,audio/wav" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                   {detectedType === MediaType.AUDIO ? (
                      <SpeakerWaveIcon className="w-8 h-8 text-blue-400" />
                   ) : (
                      <ArrowUpTrayIcon className="w-8 h-8 text-slate-400" />
                   )}
                   <span className="text-slate-400 text-sm font-mono truncate max-w-[200px]">
                     {selectedFile ? selectedFile.name : "Upload Image or Audio (.wav)"}
                   </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-emerald-500 text-xs font-mono uppercase tracking-widest mb-2">
                // Decryption Key
              </label>
              <div className="relative">
                <LockOpenIcon className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Passphrase"
                  className="w-full bg-slate-900 border border-slate-600 rounded pl-10 pr-3 py-2 text-slate-300 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={processDecryption}
              disabled={status.loading || status.type === 'destruct'}
              className={`w-full py-3 px-4 rounded font-mono font-bold tracking-wider uppercase transition-all duration-300
                ${status.loading 
                  ? 'bg-slate-700 text-slate-400' 
                  : status.type === 'destruct'
                    ? 'bg-red-900/50 text-red-500 border border-red-600 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}
            >
              {status.loading ? 'DECRYPTING...' : status.type === 'destruct' ? 'SYSTEM LOCKED' : 'EXTRACT & DECRYPT'}
            </button>

            {/* Status Log */}
            <div className={`border rounded p-3 font-mono text-xs h-24 overflow-y-auto transition-colors
                ${status.type === 'error' ? 'bg-red-900/20 border-red-800' : 
                  status.type === 'destruct' ? 'bg-red-950 border-red-600 animate-pulse' :
                  'bg-black/30 border-slate-800'}`}>
               <div className="text-slate-500 border-b border-slate-800 pb-1 mb-1">// DECODER LOG</div>
               {status.type === 'error' && <div className="text-red-400 font-bold">>> ALERT: {status.message}</div>}
               {status.type === 'destruct' && <div className="text-red-500 font-bold text-center pt-2 text-lg">⚠️ MESSAGE DESTROYED ⚠️</div>}
               {status.type === 'success' && <div className="text-emerald-400">>> SUCCESS: {status.message}</div>}
               {status.type === 'info' && <div className="text-blue-400">>> PROCESSING: {status.message}</div>}
               {status.type === 'idle' && <div className="text-slate-600">>> WAITING FOR SIGNAL...</div>}
            </div>
          </div>

          {/* Output Display */}
          <div className="flex flex-col space-y-4">
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex flex-col relative overflow-hidden min-h-[300px]">
               {/* Header */}
               <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">DECRYPTED PAYLOAD</span>
                  {status.type === 'destruct' ? (
                     <ExclamationTriangleIcon className="w-4 h-4 text-red-500 animate-bounce" />
                  ) : (
                     <ShieldCheckIcon className={`w-4 h-4 ${decryptedMessage ? 'text-emerald-500' : 'text-slate-600'}`} />
                  )}
               </div>
               
               {/* Content */}
               <div className="p-4 flex-1 font-mono text-sm text-slate-300 overflow-auto whitespace-pre-wrap break-words relative">
                  {status.type === 'destruct' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 z-20">
                      <div className="text-6xl mb-4">💥</div>
                      <div className="text-red-500 font-bold text-xl tracking-widest uppercase">Payload Expired</div>
                      <div className="text-red-400/60 text-xs mt-2">DATA AUTOMATICALLY PURGED FROM MEMORY</div>
                    </div>
                  )}

                  {decryptedMessage ? (
                    <div className="animate-typewriter">
                      <span className="text-emerald-500 font-bold">TOP SECRET//KAVACH<br/></span>
                      <br/>
                      {decryptedMessage}
                    </div>
                  ) : !status.type.includes('destruct') && (
                    <div className="h-full flex items-center justify-center opacity-30">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔒</div>
                        <div>AWAITING DECRYPTION</div>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};