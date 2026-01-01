import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, Loader2, CheckCircle, X } from './icons';
import { SYSTEM_INSTRUCTION } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Local Type Definitions for Strict Environment Compatibility ---

// 1. Handle cross-browser AudioContext (specifically for Safari/Webkit)
type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
  AudioContext: typeof AudioContext;
};

// 2. Handle newer Canvas API 'roundRect' which might be missing in default TS definitions
type CanvasCtxWithRoundRect = CanvasRenderingContext2D & {
  roundRect: (x: number, y: number, w: number, h: number, radii: number | number[]) => void;
};

// --- Helper Functions ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Visualizer Component ---

const WaveformVisualizer = ({ isActive }: { isActive: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        if (!isActive || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let t = 0;
        const draw = () => {
            if (!canvas) return;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#3f6212'; // woosh-green

            // Draw 5 bars with sine wave animation to simulate listening
            const barCount = 5;
            const spacing = 6;
            const barWidth = 6;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const totalWidth = barCount * barWidth + (barCount - 1) * spacing;
            const startX = centerX - totalWidth / 2;

            for (let i = 0; i < barCount; i++) {
                const height = 10 + Math.sin(t * 0.15 + i) * 15; 
                const x = startX + i * (barWidth + spacing);
                const y = centerY - height / 2;
                
                ctx.beginPath();
                
                // Safe check using type assertion to bypass TS build error
                // We treat ctx as our local type that MIGHT have roundRect
                const ctxSafe = ctx as unknown as CanvasCtxWithRoundRect;
                
                if (typeof ctxSafe.roundRect === 'function') {
                    ctxSafe.roundRect(x, y, barWidth, height, 5);
                } else {
                    ctx.rect(x, y, barWidth, height); // Fallback for older browsers
                }
                ctx.fill();
            }

            t++;
            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isActive]);

    return <canvas ref={canvasRef} width={80} height={60} className={isActive ? 'opacity-100' : 'opacity-0'} />;
};

// --- Main Component ---

interface LiveProps {
    onClose: () => void;
    isGuest?: boolean;
}

export const Live: React.FC<LiveProps> = ({ onClose, isGuest = false }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Wrapped in useCallback to satisfy exhaustive-deps lint rule
  const startSession = useCallback(async () => {
    try {
      setStatus('connecting');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Handle cross-browser AudioContext safely using local type
      const win = window as unknown as WindowWithWebkitAudio;
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      
      if (!AudioContextClass) {
        console.error("AudioContext not supported");
        setStatus('error');
        return;
      }

      const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      const outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputAudioContext;
      audioContextRef.current = outputAudioContext;

      // Inject current mode into system instruction
      const modeInstruction = `
        Current User Identity: ${isGuest ? 'GUEST (Customer)' : 'OWNER (Manager)'}.
        If Guest: You are a friendly barista. Guide them to order the high-value combos defined in SYSTEM_INSTRUCTION. Do NOT reveal internal data.
        If Owner: You are a sharp COO. Focus on profit, efficiency, and management.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            
            // Setup Microphone Stream
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Use Int16Array for PCM data as required by the API
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                // Convert float32 -1.0..1.0 to int16 -32768..32767
                pcmData[i] = inputData[i] * 32768;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ 
                    media: { 
                        mimeType: 'audio/pcm;rate=16000', 
                        data: base64Data 
                    } 
                 });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              setIsSpeaking(true);
              const ctx = audioContextRef.current;
              if (!ctx) return;

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                 sourcesRef.current.delete(source);
                 if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            
            if (message.serverContent?.interrupted) {
               sourcesRef.current.forEach(s => s.stop());
               sourcesRef.current.clear();
               setIsSpeaking(false);
               nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setStatus('idle');
          },
          onerror: (e: unknown) => {
            console.error(e);
            setStatus('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + modeInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      
    } catch (e) {
      console.error("Failed to start session", e);
      setStatus('error');
    }
  }, [isGuest]); // Re-create startSession if isGuest changes

  const stopSession = useCallback(() => {
     inputAudioContextRef.current?.close();
     audioContextRef.current?.close();
     setStatus('idle');
     setIsSpeaking(false);
     onClose();
  }, [onClose]);

  useEffect(() => {
      // Auto start on mount
      startSession();
      return () => {
          // Auto cleanup on unmount
          inputAudioContextRef.current?.close();
          audioContextRef.current?.close();
      }
  }, [startSession]);

  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
      <button onClick={stopSession} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100">
          <X className="w-8 h-8 text-gray-500" />
      </button>

      {/* Dynamic Waveform Visualizer */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none scale-150">
          <WaveformVisualizer isActive={status === 'connected' && !isSpeaking} />
      </div>

      <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${
        status === 'connected' 
          ? isSpeaking 
            ? 'bg-[#b45309] scale-110 shadow-xl shadow-amber-200 ring-4 ring-amber-100' 
            : 'bg-white border-2 border-[#3f6212] shadow-lg'
          : 'bg-stone-100'
      }`}>
        {status === 'connecting' ? (
           <Loader2 className="w-12 h-12 text-stone-400 animate-spin" />
        ) : (
           <Mic className={`w-12 h-12 ${status === 'connected' ? (isSpeaking ? 'text-white' : 'text-[#3f6212]') : 'text-stone-400'}`} />
        )}
      </div>

      <h2 className="text-3xl font-bold text-[#78350f] mb-2 relative z-10 text-center">
        {status === 'connecting' && "連線中..."}
        {status === 'connected' && (isSpeaking ? (isGuest ? "服務生正在說話..." : "營運長正在說話...") : "正在聆聽...")}
        {status === 'error' && "連線錯誤"}
      </h2>
      
      <p className="text-stone-500 mb-8 max-w-sm text-center relative z-10 h-6 font-medium">
        {status === 'connected' && !isSpeaking && "請直接開口詢問..."}
      </p>

      <button 
        onClick={stopSession}
        className="relative z-10 bg-stone-200 text-stone-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-stone-300 transition-colors"
      >
        結束通話
      </button>
      
      {/* Grounding Badge */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#fdfbf7] border border-[#e7e5e4] rounded-full text-xs text-[#78350f] opacity-80">
              <CheckCircle className="w-3 h-3" />
              <span>AI 回覆將依據品牌定位與現有菜單</span>
          </div>
      </div>
    </div>
  );
};