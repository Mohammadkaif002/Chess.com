'use client';

import React from 'react';
import { useChessStore } from '../lib/store';
import { X, Volume2, VolumeX, Eye, EyeOff, Film, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES = [
  { id: 'emerald', name: 'Emerald Green', light: '#eeeed2', dark: '#769656' },
  { id: 'blue', name: 'Ocean Blue', light: '#eceff1', dark: '#4a75a0' },
  { id: 'purple', name: 'Cyber Purple', light: '#f3e8ff', dark: '#7e22ce' },
  { id: 'classic', name: 'Classic Wood', light: '#f0d9b5', dark: '#b58863' },
] as const;

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings, clearStats } = useChessStore();

  const handleThemeChange = (themeId: typeof THEMES[number]['id']) => {
    updateSettings({ boardTheme: themeId });
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleCoordinates = () => {
    updateSettings({ showCoordinates: !settings.showCoordinates });
  };

  const toggleAnimations = () => {
    updateSettings({ animationsEnabled: !settings.animationsEnabled });
  };

  const togglePossibleMoves = () => {
    updateSettings({ showPossibleMoves: settings.showPossibleMoves !== false ? false : true });
  };

  const handleClearStats = () => {
    const confirmClear = confirm('Are you sure you want to clear your win/loss statistics? This cannot be undone.');
    if (confirmClear) {
      clearStats();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 right-0 top-0 z-[101] w-full max-w-sm border-l border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 shadow-2xl flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Board Settings</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Customize your premium chess arena.</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:border-zinc-700 hover:text-zinc-900 dark:text-white transition duration-200 active:scale-90"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Board Themes */}
              <div className="flex flex-col gap-3 mb-6 select-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">Board Style</span>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map((theme) => {
                    const isSelected = settings.boardTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`flex flex-col items-start gap-2 rounded-xl border p-2.5 text-left transition duration-200 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/10 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                            : 'border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 hover:border-zinc-400 dark:border-zinc-700'
                        }`}
                      >
                        <div className="flex h-10 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-900 shadow-sm">
                          <div style={{ backgroundColor: theme.light }} className="w-1/2" />
                          <div style={{ backgroundColor: theme.dark }} className="w-1/2" />
                        </div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferences Toggles */}
              <div className="flex flex-col gap-4 select-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">Gameplay Preferences</span>

                {/* Sound */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      {settings.soundEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Move Sounds</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-500">Play wood clicks and alarms</span>
                    </div>
                  </div>
                  <button
                    onClick={toggleSound}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ${
                      settings.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-250 ${
                        settings.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Coordinates */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      {settings.showCoordinates ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Coordinates</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-500">Show board letters & numbers</span>
                    </div>
                  </div>
                  <button
                    onClick={toggleCoordinates}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ${
                      settings.showCoordinates ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-250 ${
                        settings.showCoordinates ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Animations */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-150 dark:bg-zinc-900/10 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      <Film className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Piece Animations</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-500">Smooth piece transitions</span>
                    </div>
                  </div>
                  <button
                    onClick={toggleAnimations}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ${
                      settings.animationsEnabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-250 ${
                        settings.animationsEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Possible Moves Hints */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-150 dark:bg-zinc-900/10 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      <Eye className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Possible Moves Hints</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-500">Show visual guidance dots</span>
                    </div>
                  </div>
                  <button
                    onClick={togglePossibleMoves}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ${
                      settings.showPossibleMoves !== false ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-250 ${
                        settings.showPossibleMoves !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 dark:border-zinc-900 pt-4 mt-6">
              <button
                onClick={handleClearStats}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-950 bg-red-950/20 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-950/40 hover:text-red-300 hover:border-red-500/30 transition duration-200 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                Clear Game History Stats
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
