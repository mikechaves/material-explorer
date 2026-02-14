import React from 'react';
import { motion } from 'framer-motion';

type OnboardingCardProps = {
  onAddStarterKit: () => void;
  onStartBlank: () => void;
  onDismiss: () => void;
};

export function OnboardingCard({ onAddStarterKit, onStartBlank, onDismiss }: OnboardingCardProps) {
  return (
    <motion.div
      className="section-shell px-4 py-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-sm font-semibold text-slate-100">Welcome to Material Explorer</div>
      <div className="mt-1 text-xs ui-muted">
        Start fast with a polished starter kit or jump straight into a blank material.
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="ui-btn ui-btn-primary px-3 py-1.5 text-xs" onClick={onAddStarterKit}>
          Add Starter Kit
        </button>
        <button type="button" className="ui-btn px-3 py-1.5 text-xs" onClick={onStartBlank}>
          Start Blank
        </button>
        <button type="button" className="ui-btn px-3 py-1.5 text-xs" onClick={onDismiss}>
          Maybe Later
        </button>
      </div>
    </motion.div>
  );
}
