import React, { useState, useRef, useEffect } from 'react';
import { ProcessingStatus, MediaType } from '../types';
import { encryptMessage } from '../services/crypto';
import { hideTextInImage, hideTextInAudio } from '../services/steganography';
import { ArrowDownTrayIcon, LockClosedIcon, PhotoIcon, SpeakerWaveIcon, ClockIcon } from '@heroicons/react/24/outline';

export const SenderConsole: React.FC = () => {
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [ttl, setTtl] = useState<number>(0); // 0 = no expiry
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stegoUrl, setStegoUrl] = useState<string | null>(null);
  
  const [status, setStatus] = useState<ProcessingStatus>({ loading: false, message: '', type: 'idle' });

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStegoUrl(null);
      setStatus({ loading: false, message: '', type: 'idle' });
    }
  };

  const processEncryption = async () => {
    if (!message || !password || !selectedFile) {
      setStatus({ loading: false, message: 'Missing fields. Please provide message, password, and media file.', type: 'error' });
      return;
    }

    setStatus({ loading: true, message: 'Initializing Project KAVACH protocols...', type: 'info' });

    try {
      // 1. Layer 1: Encryption (with TTL)
      setStatus({ loading: true, message: `Layer 1: AES-256 Encryption ${ttl > 0 ? `(Self-Destruct: ${ttl}s)` : ''}...`, type: 'info' });
      await new Promise(r => setTimeout(r, 500));
      
      const encryptedData = await encryptMessage(message, password, ttl);

      // 2. Layer 2: Steganography
      setStatus({ loading: true, message: `Layer 2: Initiating ${mediaType} Steganography...`, type: 'info' });
      
      let resultUrl: string;

      if (mediaType === MediaType.IMAGE) {
        const img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        await new Promise((resolve) => { img.onload = resolve; });
        resultUrl = await hideTextInImage(img, encryptedData);
      } else {
        resultUrl = await hideTextInAudio(selectedFile, encryptedData);
      }
      
      setStegoUrl(resultUrl);
      setStatus({ loading: false, message: 'Operation Successful. Data concealed.', type: 'success' });

    } catch (error) {
      setStatus({ loading: false, message: `Operation Failed: ${(error as Error).message}`, type: 'error' });
    }
  };

  const handleModeChange = (mode: MediaType) => {
    setMediaType(mode);
    setSelectedFile(null);
    setPreviewUrl(null);
    setStegoUrl(null);
    setStatus({ loading: false, message: '', type: 'idle' });
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Media Type Toggle */}
      <div className="flex justify-center space-x-4 mb-4">
        <button 
          onClick={() => handleModeChange(MediaType.IMAGE)}
          className={`flex items-center space-x-2 px-4 py-2 rounded border transition-all ${mediaType === MediaType.IMAGE ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-500'}`}
        >
          <PhotoIcon className="w-5 h-5" />
          <span className="font-mono text-sm font-bold">IMAGE MODE</span>
        </button>
        <button 
          onClick={() => handleModeChange(MediaType.AUDIO)}
          className={`flex items-center space-x-2 px-4 py-2 rounded border transition-all ${mediaType === MediaType.AUDIO ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-500'}`}
        >
          <SpeakerWaveIcon className="w-5 h-5" />
          <span className="font-mono text-sm font-bold">AUDIO MODE</span>
        </button>
      </div>

      <div className="bg-drdo-card border border-slate-700 p-6 rounded-lg shadow-xl relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-emerald-500 text-xs font-mono uppercase tracking-widest mb-2">
                // Secret Battle Plan
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter highly classified coordinates or instructions..."
                className="w-full h-24 bg-slate-900 border border-slate-600 rounded p-3 text-slate-300 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-emerald-500 text-xs font-mono uppercase tracking-widest mb-2">
                  // Encryption Key
                </label>
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passphrase"
                    className="w-full bg-slate-900 border border-slate-600 rounded pl-10 pr-3 py-2 text-slate-300 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-red-500 text-xs font-mono uppercase tracking-widest mb-2">
                   // Self-Destruct
                </label>
                <div className="relative">
                  <ClockIcon className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                  <select
                    value={ttl}
                    onChange={(e) => setTtl(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded pl-10 pr-3 py-2 text-slate-300 font-mono text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none appearance-none"
                  >
                    <option value={0}>Disabled</option>
                    <option value={60}>1 Minute</option>
                    <option value={300}>5 Minutes</option>
                    <option value={3600}>1 Hour</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-emerald-500 text-xs font-mono uppercase tracking-widest mb-2">
                // Cover {mediaType === MediaType.IMAGE ? 'Image' : 'Audio'}
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:bg-slate-800/50 transition-colors text-center cursor-pointer relative">
                <input 
                  type="file" 
                  accept={mediaType === MediaType.IMAGE ? "image/png, image/jpeg" : "audio/wav"} 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                   {mediaType === MediaType.IMAGE ? (
                     <PhotoIcon className="w-8 h-8 text-slate-400" />
                   ) : (
                     <SpeakerWaveIcon className="w-8 h-8 text-slate-400" />
                   )}
                   <span className="text-slate-400 text-sm font-mono">
                     {selectedFile ? selectedFile.name : `Drop dummy ${mediaType.toLowerCase()} here`}
                   </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={processEncryption}
              disabled={status.loading}
              className={`w-full py-3 px-4 rounded font-mono font-bold tracking-wider uppercase transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]
                ${status.loading 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}
            >
              {status.loading ? 'ENCRYPTING & EMBEDDING...' : 'INITIATE PROTOCOL'}
            </button>
          </div>

          {/* Preview & Output */}
          <div className="flex flex-col space-y-4">
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden group min-h-[200px]">
              {!previewUrl && (
                <div className="text-slate-600 font-mono text-xs uppercase tracking-widest">
                  [ No Input Signal ]
                </div>
              )}
              {previewUrl && mediaType === MediaType.IMAGE && (
                <img 
                  src={previewUrl} 
                  alt="Original" 
                  className={`max-w-full max-h-48 object-contain ${stegoUrl ? 'opacity-20' : 'opacity-80'}`} 
                />
              )}
              {previewUrl && mediaType === MediaType.AUDIO && (
                <div className="w-full px-4 text-center">
                   <div className="text-emerald-500 mb-2 font-mono text-xs">SOURCE AUDIO PREVIEW</div>
                   <audio controls src={previewUrl} className="w-full opacity-80" />
                </div>
              )}

              {stegoUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 animate-pulse-slow">
                   <div className="text-emerald-400 font-mono text-lg font-bold border-2 border-emerald-500 px-6 py-2 rounded mb-2">
                      SECURED
                   </div>
                   {mediaType === MediaType.AUDIO && (
                     <div className="w-3/4">
                       <audio controls src={stegoUrl} className="w-full" />
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* Status Log */}
            <div className="bg-black/30 border border-slate-800 rounded p-3 font-mono text-xs h-24 overflow-y-auto">
               <div className="text-slate-500 border-b border-slate-800 pb-1 mb-1">// SYSTEM LOG</div>
               {status.type === 'error' && <div className="text-red-500">>> ERROR: {status.message}</div>}
               {status.type === 'success' && <div className="text-emerald-400">>> SUCCESS: {status.message}</div>}
               {status.type === 'info' && <div className="text-blue-400">>> PROCESSING: {status.message}</div>}
               {status.type === 'idle' && <div className="text-slate-600">>> WAITING FOR INPUT...</div>}
            </div>

            {/* Download */}
            {stegoUrl && (
              <a
                href={stegoUrl}
                download={`secured_mission_${Date.now()}.${mediaType === MediaType.IMAGE ? 'png' : 'wav'}`}
                className="flex items-center justify-center space-x-2 w-full py-2 border border-emerald-500/50 text-emerald-400 font-mono text-sm hover:bg-emerald-900/20 rounded transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>DOWNLOAD STEGO-DATA</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};