"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronRight, Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  isCompleted: boolean;
}

interface ChecklistProps {
  steps: Step[];
  title?: string;
}

const springConfig = { type: "spring", stiffness: 300, damping: 30 } as const;

export const OnboardingChecklist: React.FC<ChecklistProps> = ({
  steps,
  title = "Getting started",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = steps.filter(s => s.isCompleted).length;
  const totalSteps = steps.length;

  return (
    <motion.div
      layout
      transition={springConfig}
      className="w-full bg-muted/50 border border-border rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-muted-foreground shrink-0"
          >
            <ChevronUp size={20} className="sm:hidden" />
            <ChevronUp size={22} className="hidden sm:block" />
          </motion.div>
          <span className="font-semibold text-foreground text-[14px] sm:text-[15px] truncate pr-1">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-1">
          <div className="flex gap-0.5 xs:gap-[3px]">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`h-3.5 sm:h-4 w-[2.5px] sm:w-[3.5px] rounded-full transition-colors duration-500 ${
                  i < (completedCount / totalSteps) * 14
                    ? 'bg-green-500'
                    : 'bg-muted-foreground/25'
                }`}
              />
            ))}
          </div>
          <span className="text-[12px] sm:text-[13px] font-semibold text-muted-foreground min-w-7 sm:min-w-7.5 text-right">
            {completedCount}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Expanded items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springConfig}
            className="border-t border-border bg-card rounded-t-2xl"
          >
            <div className="p-1.5 sm:p-2 space-y-0.5">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="group flex items-center justify-between p-2.5 sm:p-3 px-3 sm:px-4 hover:bg-muted/50 rounded-xl cursor-pointer transition-all active:scale-[0.98] sm:active:scale-100"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {step.isCompleted ? (
                      <div className="w-5 h-4.5 sm:w-6 sm:h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={4} className="text-white sm:hidden" />
                        <Check size={12} strokeWidth={4} className="text-white hidden sm:block" />
                      </div>
                    ) : (
                      <div className={`w-5 h-4.5 sm:w-6 sm:h-5 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-[12px] font-semibold shrink-0 ${
                        step.id === 3
                          ? 'bg-foreground border-foreground text-background'
                          : 'border-border text-muted-foreground'
                      }`}>
                        {step.id}
                      </div>
                    )}
                    <span className={`text-[13px] sm:text-[14px] font-medium transition-colors truncate ${
                      step.isCompleted
                        ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                        : 'text-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>

                  {!step.isCompleted && (
                    <ChevronRight size={14} className="text-muted-foreground/40 shrink-0 sm:size-4" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
