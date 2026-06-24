import { useEffect, useRef } from 'react';
import { useChessStore } from '../lib/store';

export function useChessSounds() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const setSoundTriggerCallback = useChessStore((state) => state.setSoundTriggerCallback);

  useEffect(() => {
    // Lazy initialize AudioContext on user interaction to comply with browser autoplay policies
    const getAudioContext = (): AudioContext => {
      if (!audioCtxRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    };

    const playMoveSound = () => {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Sound configuration - soft, organic wood-like tap
        osc.type = 'triangle';
        const now = ctx.currentTime;
        
        // Pitch envelope
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

        // Amplitude envelope
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {
        console.warn('AudioContext failed to play move sound', e);
      }
    };

    const playCaptureSound = () => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Double-tap sound for capture (two quick pulses close together)
        const playPulse = (delay: number, pitch: number, volume: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(pitch, now + delay);
          osc.frequency.exponentialRampToValueAtTime(pitch / 2, now + delay + 0.05);

          gain.gain.setValueAtTime(volume, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

          osc.start(now + delay);
          osc.stop(now + delay + 0.05);
        };

        // First click
        playPulse(0, 440, 0.4);
        // Second click slightly lower and delayed
        playPulse(0.06, 310, 0.35);
      } catch (e) {
        console.warn('AudioContext failed to play capture sound', e);
      }
    };

    const playCheckSound = () => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        
        // Two oscillators for a dissonant/urgent ring
        const playTone = (pitch: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(pitch, now);
          osc.frequency.linearRampToValueAtTime(pitch + 10, now + 0.25);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc.start(now);
          osc.stop(now + 0.25);
        };

        playTone(587.33); // D5
        playTone(622.25); // D#5 (dissonant semitone for check alarm)
      } catch (e) {
        console.warn('AudioContext failed to play check sound', e);
      }
    };

    const playGameOverSound = () => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Ascending/descending chord resolution
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((pitch, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(pitch, now + i * 0.07);

          gain.gain.setValueAtTime(0.15, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);

          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.4);
        });
      } catch (e) {
        console.warn('AudioContext failed to play gameover sound', e);
      }
    };

    // Register callback with the state store
    setSoundTriggerCallback((type) => {
      switch (type) {
        case 'move':
          playMoveSound();
          break;
        case 'capture':
          playCaptureSound();
          break;
        case 'check':
          playCheckSound();
          break;
        case 'gameover':
          playGameOverSound();
          break;
      }
    });

  }, [setSoundTriggerCallback]);
}
