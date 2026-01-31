import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  label?: string; // Optional context for error message
  className?: string;
}

export const ValidatedInput: React.FC<Props> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  label,
  className = ""
}) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value changes
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
        setLocalValue(value.toString());
        setError(null);
    } else {
        const currentNum = parseFloat(localValue);
        if (!isNaN(currentNum) && currentNum !== value) {
             setLocalValue(value.toString());
        }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setLocalValue(rawVal);

    if (rawVal === '') {
        return; 
    }

    const numVal = parseFloat(rawVal);
    
    if (isNaN(numVal)) {
        setError('Invalid');
        return;
    }

    let err = null;
    if (min !== undefined && numVal < min) err = `Min: ${min}`;
    if (max !== undefined && numVal > max) err = `Max: ${max}`;

    setError(err);

    if (!err) {
        onChange(numVal);
    }
  };

  return (
    <div className={`relative flex items-center bg-white dark:bg-slate-900 border rounded shadow-sm px-2 py-1 transition-colors ${error ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-nordic-sage dark:hover:border-slate-500'} ${className}`}>
      {prefix && <span className={`text-xs mr-1 select-none font-medium ${error ? 'text-red-400' : 'text-gray-400'}`}>{prefix}</span>}
      <input
        ref={inputRef}
        type="number"
        step={step}
        value={localValue}
        onChange={handleChange}
        className={`w-full bg-transparent text-xs outline-none font-mono font-medium ${error ? 'text-red-700 dark:text-red-400' : 'text-nordic-slate dark:text-white'}`}
      />
      {suffix && <span className={`text-xs ml-1 select-none font-medium ${error ? 'text-red-400' : 'text-gray-400'}`}>{suffix}</span>}
      
      {/* Error Indicator Icon */}
      {error && <AlertCircle size={14} className="text-red-500 ml-2 flex-shrink-0" />}

      {/* Persistent Error Message */}
      {error && (
        <div className="absolute top-full left-0 mt-1.5 w-max max-w-[200px] bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-[10px] font-medium px-2 py-1 rounded shadow-md z-50">
           {label ? <span className="font-bold mr-1">{label}:</span> : ''}{error}
           {/* Little arrow pointing up */}
           <div className="absolute bottom-full left-3 border-4 border-transparent border-b-red-200 dark:border-b-red-800"></div>
        </div>
      )}
    </div>
  );
};

