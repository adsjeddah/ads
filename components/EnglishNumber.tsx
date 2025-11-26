import React from 'react';
import { formatNumber, formatPrice, toEnglishNumerals } from '@/lib/utils/numbers';

/**
 * مكون لعرض الأرقام بالإنجليزية بشكل موحد
 */

interface EnglishNumberProps {
  value: number | string | null | undefined;
  type?: 'number' | 'price' | 'percentage';
  currency?: string;
  className?: string;
  decimals?: number;
}

export default function EnglishNumber({
  value,
  type = 'number',
  currency = 'ريال',
  className = '',
  decimals
}: EnglishNumberProps) {
  if (value === null || value === undefined || value === '') {
    return <span className={`english-numbers ${className}`}>0</span>;
  }

  let formatted: string;

  switch (type) {
    case 'price':
      formatted = formatPrice(value, currency);
      break;
    case 'percentage':
      const num = typeof value === 'string' ? parseFloat(value) : value;
      formatted = `${decimals !== undefined ? num.toFixed(decimals) : num}%`;
      break;
    case 'number':
    default:
      formatted = formatNumber(value);
      break;
  }

  return <span className={`english-numbers ${className}`}>{formatted}</span>;
}

/**
 * مكون Input للأرقام الإنجليزية
 */
interface EnglishNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EnglishNumberInput({
  value,
  onChange,
  className = '',
  ...props
}: EnglishNumberInputProps) {
  return (
    <input
      {...props}
      type="number"
      value={value}
      onChange={onChange}
      className={`english-numbers ${className}`}
      dir="ltr"
    />
  );
}





