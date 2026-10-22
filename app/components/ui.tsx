"use client";

import { useEffect, useRef } from "react";
import { Sparkles, Cog, User } from "lucide-react";
import { etapaInfo } from "../lib/catalogo";
import type { Etapa, Origen, Puntuacion } from "../lib/tipos";

export const euros = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function hace(fechaIso: string): string {
  const s = (Date.now() - new Date(fechaIso).getTime()) / 1000;
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#15171c" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M16 6.5 L19.2 16 L16 25.5 L12.8 16 Z" fill="#ffffff" fillOpacity="0.35" />
      <path d="M16 6.5 L19.2 16 L12.8 16 Z" fill="#1fbf9f" />
      <circle cx="16" cy="16" r="1.6" fill="#15171c" />
    </svg>
  );
}

export function Iniciales({ nombre, className = "h-8 w-8 text-xs" }: { nombre: string; className?: string }) {
  const ini = (nombre.trim() || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-tinta/80 ${className}`}
      style={{ background: `hsl(${h} 45% 90%)` }}
      aria-hidden="true"
    >
      {ini}
    </span>
  );
}

export function EtapaBadge({ etapa }: { etapa: Etapa }) {
  const e = etapaInfo(etapa);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-linea bg-superficie px-2 py-0.5 text-xs font-semibold text-tinta">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} aria-hidden="true" />
      {e.nombre}
    </span>
  );
}

export function OrigenTag({ origen }: { origen: Origen | "humano" }) {
  if (origen === "ia")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-ia-clara px-1.5 py-0.5 text-[11px] font-bold text-ia" title="Generado con IA: revísalo antes de usarlo">
        <Sparkles className="h-3 w-3" aria-hidden="true" /> IA
      </span>
    );
  if (origen === "humano")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-marca-clara px-1.5 py-0.5 text-[11px] font-bold text-marca-oscura">
        <User className="h-3 w-3" aria-hidden="true" /> Humano
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-hundido px-1.5 py-0.5 text-[11px] font-bold text-suave" title="Generado con reglas, sin IA">
      <Cog className="h-3 w-3" aria-hidden="true" /> Reglas
    </span>
  );
}

const COLOR_NIVEL = { alta: "#0d7a68", media: "#b9760c", baja: "#9096a0" };

export function PuntuacionAnillo({ p, tamano = 44 }: { p: Puntuacion; tamano?: number }) {
  const r = tamano / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: tamano, height: tamano }} title={`Encaje ${p.total}/100`}>
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden="true">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="#ecebe6" strokeWidth="4" />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke={COLOR_NIVEL[p.nivel]}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p.total / 100)}
        />
      </svg>
      <span className="cifras absolute text-[13px] font-extrabold" style={{ fontSize: tamano < 40 ? 11 : 13 }}>
        {p.total}
      </span>
      <span className="sr-only">Encaje {p.total} sobre 100, {p.nivel}</span>
    </span>
  );
}

export function NivelBadge({ p }: { p: Puntuacion }) {
  const estilos = { alta: "bg-marca-clara text-marca-oscura", media: "bg-ambar-clara text-ambar", baja: "bg-hundido text-suave" };
  const texto = { alta: "Encaje alto", media: "Encaje medio", baja: "Encaje bajo" };
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${estilos[p.nivel]}`}>{texto[p.nivel]}</span>;
}

export function Tarjeta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border border-linea bg-superficie shadow-tarjeta ${className}`}>{children}</section>;
}

export const boton = {
  primario:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-tinta px-3.5 py-2 text-sm font-bold text-white shadow-tarjeta transition hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
  marca:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-marca px-3.5 py-2 text-sm font-bold text-white shadow-tarjeta transition hover:bg-marca-oscura active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
  ia: "inline-flex items-center justify-center gap-2 rounded-xl bg-ia px-3.5 py-2 text-sm font-bold text-white shadow-tarjeta transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
  secundario:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-linea bg-superficie px-3.5 py-2 text-sm font-bold text-tinta transition hover:bg-hundido active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
  fantasma:
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-suave transition hover:bg-hundido hover:text-tinta disabled:opacity-40",
};

export const campoBase =
  "rounded-xl border border-linea bg-superficie px-3 py-2 text-sm outline-none transition placeholder:text-tenue focus:border-marca focus:ring-4 focus:ring-marca/10 disabled:bg-hundido/50 disabled:text-suave";
export const campo = `w-full ${campoBase}`;

// Cierra un diálogo con Escape aunque el foco no esté dentro
export function useEscape(activo: boolean, cerrar: () => void) {
  useEffect(() => {
    if (!activo) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [activo, cerrar]);
}

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocoDialogo<T extends HTMLElement>(activo: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!activo) return;
    const previo = document.activeElement as HTMLElement | null;
    const raiz = ref.current;
    const alTabular = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !raiz) return;
      const els = [...raiz.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const [primero, ultimo] = [els[0], els[els.length - 1]];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener("keydown", alTabular);
    return () => {
      window.removeEventListener("keydown", alTabular);
      previo?.focus?.();
    };
  }, [activo]);
  return ref;
}
