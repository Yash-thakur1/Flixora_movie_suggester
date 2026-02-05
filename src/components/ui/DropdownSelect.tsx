'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable dropdown selector — single or multi-select.
 * Touch-friendly (48 px tap targets), animated, auto-closes on outside tap.
 */

export interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

/* ── Single select ── */
interface SingleSelectProps {
  mode?: 'single';
  options: DropdownOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

/* ── Multi select ── */
interface MultiSelectProps {
  mode: 'multi';
  options: DropdownOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

type DropdownSelectProps = SingleSelectProps | MultiSelectProps;

export function DropdownSelect(props: DropdownSelectProps) {
  const {
    options,
    placeholder = 'Select…',
    label,
    className,
    mode = 'single',
  } = props;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  /* ── Helpers ── */
  const isMulti = mode === 'multi';
  const selectedValues: (string | number)[] = isMulti
    ? (props as MultiSelectProps).value
    : (props as SingleSelectProps).value != null
      ? [(props as SingleSelectProps).value!]
      : [];

  const isSelected = (v: string | number) => selectedValues.includes(v);

  const handleSelect = useCallback(
    (optValue: string | number) => {
      if (isMulti) {
        const multi = props as MultiSelectProps;
        const next = multi.value.includes(optValue)
          ? multi.value.filter((v) => v !== optValue)
          : [...multi.value, optValue];
        multi.onChange(next);
        // keep open for multi-select
      } else {
        const single = props as SingleSelectProps;
        single.onChange(single.value === optValue ? null : optValue);
        setOpen(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMulti, selectedValues]
  );

  const clearAll = useCallback(() => {
    if (isMulti) {
      (props as MultiSelectProps).onChange([]);
    } else {
      (props as SingleSelectProps).onChange(null);
    }
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMulti]);

  /* ── Trigger text ── */
  const triggerText = (() => {
    if (selectedValues.length === 0) return placeholder;
    if (!isMulti) {
      const opt = options.find((o) => o.value === selectedValues[0]);
      return opt ? `${opt.icon || ''} ${opt.label}`.trim() : placeholder;
    }
    if (selectedValues.length <= 2) {
      return selectedValues
        .map((v) => {
          const o = options.find((o) => o.value === v);
          return o ? `${o.icon || ''} ${o.label}`.trim() : '';
        })
        .join(', ');
    }
    return `${selectedValues.length} selected`;
  })();

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1.5">{label}</p>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center justify-between w-full min-h-[44px] px-4 py-2.5',
          'bg-dark-800 border rounded-xl text-sm',
          'transition-colors duration-150',
          open
            ? 'border-primary-500 ring-1 ring-primary-500/30'
            : 'border-dark-700 hover:border-dark-600',
          selectedValues.length > 0 ? 'text-white' : 'text-gray-400'
        )}
      >
        <span className="truncate">{triggerText}</span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedValues.length > 0 && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-0.5 rounded hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 left-0 right-0 mt-1.5',
              'bg-dark-900 border border-dark-700 rounded-xl shadow-2xl',
              'max-h-[60vh] overflow-y-auto overscroll-contain',
              'scrollbar-hide'
            )}
          >
            <div className="py-1">
              {options.map((opt) => {
                const active = isSelected(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3 text-sm',
                      'transition-colors duration-100',
                      'min-h-[44px]',
                      active
                        ? 'bg-primary-600/10 text-white'
                        : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                    )}
                  >
                    {opt.icon && <span className="text-base shrink-0">{opt.icon}</span>}
                    <span className="flex-1 text-left">{opt.label}</span>
                    {active && <Check className="w-4 h-4 text-primary-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
