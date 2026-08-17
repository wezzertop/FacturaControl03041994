"use client";

import React, { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: number | string;
  onChange: (numericValue: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  className = "",
  disabled = false,
  required = false,
  autoFocus = false,
  id,
  name,
}: CurrencyInputProps) {
  // Función para formatear valor numérico a texto con comas de miles
  const formatRawValue = (val: number | string) => {
    if (val === "" || val === null || val === undefined) return "";
    const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatRawValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatRawValue(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    // Permitir únicamente números y un solo punto decimal
    inputVal = inputVal.replace(/[^0-9.]/g, "");

    // Eliminar ceros iniciales como '04343' -> '4343'
    if (/^0[0-9]/.test(inputVal)) {
      inputVal = inputVal.replace(/^0+/, "");
    }

    // Evitar múltiples puntos decimales
    const parts = inputVal.split(".");
    if (parts.length > 2) {
      inputVal = parts[0] + "." + parts.slice(1).join("");
    }

    // Limitar parte decimal a 2 dígitos max
    if (parts.length === 2 && parts[1].length > 2) {
      inputVal = parts[0] + "." + parts[1].substring(0, 2);
    }

    setDisplayValue(inputVal);

    const numeric = parseFloat(inputVal);
    onChange(isNaN(numeric) ? 0 : numeric);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numeric = parseFloat(displayValue);
    if (!isNaN(numeric) && numeric > 0) {
      setDisplayValue(
        numeric.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      setDisplayValue("");
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Si el valor actual es 0 o está vacío, limpiar la caja para escribir directamente sin cero inicial
    const numeric = parseFloat(displayValue.replace(/,/g, ""));
    if (isNaN(numeric) || numeric === 0) {
      setDisplayValue("");
    } else {
      setDisplayValue(numeric.toString());
    }
    e.target.select();
  };

  return (
    <div className="relative w-full">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-black text-sm pointer-events-none select-none">
        $
      </div>
      <input
        type="text"
        inputMode="decimal"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-cerulean transition-all ${className}`}
      />
    </div>
  );
}
