import React, { useLayoutEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (rawNumericString: string) => void;
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function formatCurrencyDisplay(raw: string): string {
  if (!raw || raw.trim() === '') return '';
  const num = parseFloat(raw.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '$0.00',
  id,
  ariaLabel,
  style,
  className = 'input'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextCaretRef = useRef<number | null>(null);
  const displayValue = formatCurrencyDisplay(value);

  useLayoutEffect(() => {
    if (nextCaretRef.current !== null && inputRef.current) {
      const pos = Math.min(nextCaretRef.current, displayValue.length);
      inputRef.current.setSelectionRange(pos, pos);
      nextCaretRef.current = null;
    }
  }, [displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const caret = e.target.selectionStart ?? rawInput.length;

    // Strip everything except digits and decimal point
    const cleaned = rawInput.replace(/[^0-9.]/g, '');
    if (cleaned === '' || cleaned === '.') {
      onChange('');
      return;
    }

    // Handle multiple dots (keep first)
    const parts = cleaned.split('.');
    const intPart = parts[0].replace(/^0+(?=\d)/, '') || '0';
    const decPart = parts.length > 1 ? parts.slice(1).join('').slice(0, 2) : '';
    const normalized = parts.length > 1 ? `${intPart}.${decPart}` : intPart;

    const num = parseFloat(normalized);
    if (isNaN(num)) {
      onChange('');
      return;
    }

    // Determine whether user is editing integer part or decimal part
    const dotIndex = rawInput.indexOf('.');
    const editingDecimals = dotIndex !== -1 && caret > dotIndex;

    const formattedNext = formatCurrencyDisplay(String(num));
    const formattedDot = formattedNext.indexOf('.');

    if (editingDecimals) {
      const decCharsTyped = rawInput.slice(dotIndex + 1, caret).replace(/[^0-9]/g, '').length;
      nextCaretRef.current = formattedDot + 1 + Math.min(2, decCharsTyped);
    } else {
      // Place caret right before the decimal point when typing integer digits
      // Count how many integer digits were to the left of the caret
      const intBeforeCaret = rawInput
        .slice(0, dotIndex !== -1 ? Math.min(caret, dotIndex) : caret)
        .replace(/[^0-9]/g, '').length;
      // Map that digit count into formattedNext
      let seenDigits = 0;
      let targetPos = 1; // right after '$'
      for (let i = 0; i < formattedDot; i++) {
        if (/\d/.test(formattedNext[i])) {
          seenDigits++;
        }
        if (seenDigits === intBeforeCaret) {
          targetPos = i + 1;
          break;
        }
      }
      if (intBeforeCaret === 0) targetPos = 1;
      nextCaretRef.current = targetPos;
    }

    onChange(num.toFixed(2));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '.' && inputRef.current) {
      const dotPos = displayValue.indexOf('.');
      if (dotPos !== -1) {
        e.preventDefault();
        inputRef.current.setSelectionRange(dotPos + 1, dotPos + 1);
      }
    }
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      className={className}
      style={style}
      value={displayValue}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};
