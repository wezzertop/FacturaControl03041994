"use client";

import React from "react";
import { 
  Tv, 
  Music, 
  Wifi, 
  Zap, 
  Home, 
  Dumbbell, 
  Film, 
  Smartphone, 
  ShoppingBag, 
  Car,
  Globe,
  DollarSign
} from "lucide-react";

export type ServiceBrand = 
  | "netflix" 
  | "spotify" 
  | "apple" 
  | "amazon" 
  | "youtube" 
  | "disney" 
  | "cfe" 
  | "telmex" 
  | "totalplay" 
  | "izzi" 
  | "gym" 
  | "renta" 
  | "uber" 
  | "generic";

interface BrandServiceIconProps {
  brand: string | ServiceBrand;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function detectServiceBrand(concept: string): ServiceBrand {
  const lower = (concept || "").toLowerCase();
  if (lower.includes("netflix")) return "netflix";
  if (lower.includes("spotify")) return "spotify";
  if (lower.includes("apple") || lower.includes("icloud")) return "apple";
  if (lower.includes("amazon") || lower.includes("prime")) return "amazon";
  if (lower.includes("youtube") || lower.includes("google")) return "youtube";
  if (lower.includes("disney") || lower.includes("star+")) return "disney";
  if (lower.includes("cfe") || lower.includes("luz") || lower.includes("electricidad")) return "cfe";
  if (lower.includes("telmex") || lower.includes("infinitum")) return "telmex";
  if (lower.includes("totalplay")) return "totalplay";
  if (lower.includes("izzi")) return "izzi";
  if (lower.includes("gym") || lower.includes("gimnasio") || lower.includes("smartfit")) return "gym";
  if (lower.includes("renta") || lower.includes("mantenimiento") || lower.includes("hipoteca")) return "renta";
  if (lower.includes("uber") || lower.includes("didi") || lower.includes("cabify")) return "uber";
  if (lower.includes("internet") || lower.includes("telefonía")) return "telmex";
  return "generic";
}

export default function BrandServiceIcon({ brand, className = "", size = "md" }: BrandServiceIconProps) {
  const normalized = (typeof brand === "string" ? detectServiceBrand(brand) : brand) as ServiceBrand;

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base"
  }[size];

  switch (normalized) {
    case "netflix":
      return (
        <div className={`rounded-xl bg-[#E50914] text-white flex items-center justify-center font-black shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <span className="font-serif tracking-tighter text-base leading-none">N</span>
        </div>
      );

    case "spotify":
      return (
        <div className={`rounded-xl bg-[#1DB954] text-black flex items-center justify-center shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.5 9.722 1.113.294.18.386.562.207.857zm1.225-2.723c-.226.367-.708.482-1.075.257-2.69-1.653-6.79-2.133-9.97-1.168-.413.126-.85-.11-.976-.523-.125-.413.11-.85.523-.976 3.633-1.102 8.147-.568 11.24 1.335.368.225.483.707.258 1.075zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.018-.13-1.168-.624-.15-.493.13-1.017.624-1.167 3.532-1.072 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.444-.838.59-1.282.327z" />
          </svg>
        </div>
      );

    case "apple":
      return (
        <div className={`rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.92.04-2.02.62-2.67 1.37-.58.66-1.08 1.73-.95 2.76 1.02.08 2.08-.51 2.7-1.26z" />
          </svg>
        </div>
      );

    case "amazon":
      return (
        <div className={`rounded-xl bg-[#00A8E1] text-white flex items-center justify-center font-black shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <span className="font-sans font-black tracking-tight text-xs">prime</span>
        </div>
      );

    case "youtube":
      return (
        <div className={`rounded-xl bg-[#FF0000] text-white flex items-center justify-center shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      );

    case "disney":
      return (
        <div className={`rounded-xl bg-[#113CCF] text-white flex items-center justify-center font-serif font-black shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <span className="text-xs font-bold">D+</span>
        </div>
      );

    case "cfe":
      return (
        <div className={`rounded-xl bg-[#008A44] text-white flex items-center justify-center font-black shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
        </div>
      );

    case "telmex":
      return (
        <div className={`rounded-xl bg-[#00529B] text-white flex items-center justify-center shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <Wifi className="w-5 h-5" />
        </div>
      );

    case "totalplay":
      return (
        <div className={`rounded-xl bg-[#E31B23] text-white flex items-center justify-center font-black shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <Globe className="w-5 h-5" />
        </div>
      );

    case "izzi":
      return (
        <div className={`rounded-xl bg-[#FF4F00] text-white flex items-center justify-center font-bold shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <span className="text-[10px] font-black uppercase">izzi</span>
        </div>
      );

    case "gym":
      return (
        <div className={`rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <Dumbbell className="w-5 h-5" />
        </div>
      );

    case "renta":
      return (
        <div className={`rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <Home className="w-5 h-5" />
        </div>
      );

    case "uber":
      return (
        <div className={`rounded-xl bg-black text-white border border-white/20 flex items-center justify-center shadow-sm shrink-0 ${sizeClasses} ${className}`}>
          <Car className="w-5 h-5" />
        </div>
      );

    default:
      return (
        <div className={`rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
          <Tv className="w-4 h-4" />
        </div>
      );
  }
}
