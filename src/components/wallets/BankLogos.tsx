"use client";

import React from "react";

export type BankType = 
  | "bbva" 
  | "nu" 
  | "santander" 
  | "banamex" 
  | "banorte" 
  | "mercadopago" 
  | "hsbc" 
  | "scotiabank" 
  | "heybanco" 
  | "rappi" 
  | "spin" 
  | "azteca" 
  | "amex" 
  | "cash" 
  | "generic";

export function detectBankType(name: string = "", type: string = ""): BankType {
  const n = name.toLowerCase();
  if (n.includes("bbva") || n.includes("bancomer")) return "bbva";
  if (n.includes("nu") || n.includes("nubank")) return "nu";
  if (n.includes("santander") || n.includes("likeu") || n.includes("fiesta")) return "santander";
  if (n.includes("banamex") || n.includes("citibanamex") || n.includes("citi")) return "banamex";
  if (n.includes("banorte") || n.includes("ixe")) return "banorte";
  if (n.includes("mercado") || n.includes("mp") || n.includes("mercadopago")) return "mercadopago";
  if (n.includes("hsbc")) return "hsbc";
  if (n.includes("scotia") || n.includes("scotiabank")) return "scotiabank";
  if (n.includes("hey") || n.includes("heybanco")) return "heybanco";
  if (n.includes("rappi") || n.includes("rappicard")) return "rappi";
  if (n.includes("spin") || n.includes("oxxo")) return "spin";
  if (n.includes("azteca") || n.includes("guardadito")) return "azteca";
  if (n.includes("amex") || n.includes("american express")) return "amex";
  if (type === "cash" || n.includes("efectivo") || n.includes("caja") || n.includes("billetera")) return "cash";
  return "generic";
}

export interface BankThemeConfig {
  type: BankType;
  name: string;
  gradient: string;
  textColor: string;
  chipColor: string;
  accentColor: string;
  network: "VISA" | "Mastercard" | "AMEX" | "CASH" | "DEBIT";
}

export function getBankThemeConfig(name: string = "", type: string = ""): BankThemeConfig {
  const bank = detectBankType(name, type);

  switch (bank) {
    case "bbva":
      return {
        type: "bbva",
        name: "BBVA",
        gradient: "from-[#002B49] via-[#004481] to-[#04152d]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#004481",
        network: "VISA",
      };
    case "nu":
      return {
        type: "nu",
        name: "Nu México",
        gradient: "from-[#820AD1] via-[#5B0891] to-[#2E0249]",
        textColor: "text-white",
        chipColor: "bg-amber-200",
        accentColor: "#820AD1",
        network: "Mastercard",
      };
    case "santander":
      return {
        type: "santander",
        name: "Santander",
        gradient: "from-[#EC0000] via-[#A80000] to-[#5C0000]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#EC0000",
        network: "Mastercard",
      };
    case "banamex":
      return {
        type: "banamex",
        name: "Citibanamex",
        gradient: "from-[#002D72] via-[#056DAE] to-[#00173D]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#056DAE",
        network: "Mastercard",
      };
    case "banorte":
      return {
        type: "banorte",
        name: "Banorte",
        gradient: "from-[#EB1C24] via-[#A81016] to-[#4F070A]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#EB1C24",
        network: "VISA",
      };
    case "mercadopago":
      return {
        type: "mercadopago",
        name: "Mercado Pago",
        gradient: "from-[#009EE3] via-[#007EA7] to-[#003459]",
        textColor: "text-white",
        chipColor: "bg-amber-200",
        accentColor: "#009EE3",
        network: "VISA",
      };
    case "hsbc":
      return {
        type: "hsbc",
        name: "HSBC",
        gradient: "from-[#DB0011] via-[#222222] to-[#0A0A0A]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#DB0011",
        network: "Mastercard",
      };
    case "scotiabank":
      return {
        type: "scotiabank",
        name: "Scotiabank",
        gradient: "from-[#EC111A] via-[#940B10] to-[#3B0406]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#EC111A",
        network: "VISA",
      };
    case "heybanco":
      return {
        type: "heybanco",
        name: "Hey Banco",
        gradient: "from-[#000000] via-[#1A1A1A] to-[#0D0D0D]",
        textColor: "text-[#00FF66]",
        chipColor: "bg-[#00FF66]",
        accentColor: "#00FF66",
        network: "Mastercard",
      };
    case "rappi":
      return {
        type: "rappi",
        name: "RappiCard",
        gradient: "from-[#FF441F] via-[#CC2E0E] to-[#661707]",
        textColor: "text-white",
        chipColor: "bg-amber-200",
        accentColor: "#FF441F",
        network: "VISA",
      };
    case "spin":
      return {
        type: "spin",
        name: "Spin by OXXO",
        gradient: "from-[#4B1E78] via-[#F47920] to-[#E30613]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#F47920",
        network: "VISA",
      };
    case "azteca":
      return {
        type: "azteca",
        name: "Banco Azteca",
        gradient: "from-[#006341] via-[#00472F] to-[#002619]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#006341",
        network: "Mastercard",
      };
    case "amex":
      return {
        type: "amex",
        name: "American Express",
        gradient: "from-[#2C4D75] via-[#1E3552] to-[#0B1420]",
        textColor: "text-[#E6E6E6]",
        chipColor: "bg-slate-300",
        accentColor: "#2C4D75",
        network: "AMEX",
      };
    case "cash":
      return {
        type: "cash",
        name: "Efectivo / Caja",
        gradient: "from-[#065F46] via-[#047857] to-[#064E3B]",
        textColor: "text-white",
        chipColor: "bg-emerald-300",
        accentColor: "#047857",
        network: "CASH",
      };
    default:
      return {
        type: "generic",
        name: name || "Tarjeta",
        gradient: type === "credit" 
          ? "from-[#1E293B] via-[#0F172A] to-[#020617]" 
          : "from-[#007EA7] via-[#003459] to-[#00171F]",
        textColor: "text-white",
        chipColor: "bg-amber-300",
        accentColor: "#007EA7",
        network: type === "credit" ? "Mastercard" : "DEBIT",
      };
  }
}

export function BankLogo({ bank, className = "h-5 w-auto" }: { bank: BankType; className?: string }) {
  switch (bank) {
    case "bbva":
      return (
        <span className={`font-black tracking-tighter text-base italic ${className}`}>
          BBVA
        </span>
      );
    case "nu":
      return (
        <span className={`font-black tracking-tight text-lg italic ${className}`}>
          nu
        </span>
      );
    case "santander":
      return (
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-2.48 0-4.5-2.02-4.5-4.5S10.52 7.5 13 7.5c1.47 0 2.77.71 3.58 1.81l-1.63 1.09c-.46-.62-1.18-1.02-1.95-1.02-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c.77 0 1.49-.4 1.95-1.02l1.63 1.09c-.81 1.1-2.11 1.81-3.58 1.81z"/>
          </svg>
          <span className="font-extrabold tracking-tight text-sm">Santander</span>
        </div>
      );
    case "banamex":
      return (
        <span className="font-extrabold tracking-tight text-sm">
          citibanamex
        </span>
      );
    case "banorte":
      return (
        <span className="font-black tracking-tight text-sm uppercase">
          BANORTE
        </span>
      );
    case "mercadopago":
      return (
        <div className="flex items-center gap-1 font-extrabold text-sm">
          <span>mercado</span>
          <span className="font-bold opacity-80">pago</span>
        </div>
      );
    case "hsbc":
      return (
        <div className="flex items-center gap-1.5 font-black text-sm">
          <div className="w-3 h-3 bg-red-600 rotate-45" />
          <span>HSBC</span>
        </div>
      );
    case "heybanco":
      return (
        <span className="font-black tracking-tight text-sm text-[#00FF66]">
          hey!
        </span>
      );
    case "rappi":
      return (
        <span className="font-black tracking-tight text-sm italic">
          RappiCard
        </span>
      );
    case "spin":
      return (
        <span className="font-black tracking-tight text-sm">
          Spin <span className="text-amber-300">by OXXO</span>
        </span>
      );
    default:
      return null;
  }
}
