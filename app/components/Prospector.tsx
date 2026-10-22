"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Loader2, Radar, Sparkles, X } from "lucide-react";
import { ejecutarAgentes, prospectar } from "../lib/agentes";
import { useCRM } from "../lib/store";
import type { Origen } from "../lib/tipos";
import { OrigenTag, boton, campo, useEscape, useFocoDialogo } from "./ui";

const IDEAS = [
  "Cadenas de hostelería en Andalucía de 50 a 250 empleados que siguen fichando en papel",
  "Operadores logísticos con turnos de noche y picos de campaña",
  "Clínicas y residencias con guardias 24/7 en varios centros",
];

export default function Prospector({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [peticion, setPeticion] = useState("");
  const [cantidad, setCantidad] = useState(4);
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState<{ ids: string[]; modo: Origen } | null>(null);
  const leads = useCRM((s) => s.leads);

  const cerrar = () => {
    if (trabajando) return;
    setResultado(null);
    onCerrar();
  };

  const lanzar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peticion.trim()) return;
    setTrabajando(true);
    try {
      setResultado(await prospectar(peticion.trim(), cantidad));
    } finally {
      setTrabajando(false);
    }
  };

  const creados = resultado ? leads.filter((l) => resultado.ids.includes(l.id)) : [];

  useEscape(abierto, cerrar);
  const dialogo = useFocoDialogo<HTMLDivElement>(abierto);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px]" onClick={cerrar} />
          <motion.div
            ref={dialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-prospector"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative w-full max-w-xl overflow-hidden rounded-t-3xl bg-superficie shadow-elevada sm:rounded-3xl"
          >
            <div className="desplazable max-h-[92dvh] overflow-y-auto p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="titulo-prospector" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                  <Radar className="h-5 w-5 text-ia" aria-hidden="true" /> Buscar leads con el prospector
                </h2>
                <p className="mt-1 text-sm text-suave">Describe a quién quieres encontrar y el agente propondrá cuentas que encajen.</p>
              </div>
              <button type="button" onClick={cerrar} className={boton.fantasma} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 flex gap-2 rounded-xl bg-hundido/70 p-3 text-xs leading-relaxed text-suave">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              En esta demo las cuentas son ficticias, para practicar el flujo sin tratar datos de personas reales. En producción, el prospector se conectaría a una fuente de datos de empresas con base legal.
            </p>

            {!resultado ? (
              <form onSubmit={lanzar} className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-suave">Perfil que buscas</span>
                  <textarea className={`${campo} min-h-[84px]`} value={peticion} onChange={(e) => setPeticion(e.target.value)} maxLength={400} autoFocus required />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {IDEAS.map((i) => (
                    <button key={i} type="button" onClick={() => setPeticion(i)} className="rounded-full border border-linea px-2.5 py-1 text-left text-xs font-semibold text-suave transition hover:bg-hundido hover:text-tinta">
                      {i}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-3">
                  <span className="text-xs font-bold text-suave">Cuántas cuentas</span>
                  <input type="range" min={2} max={6} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="flex-1 accent-[#6a4fd6]" />
                  <span className="cifras w-4 text-sm font-bold">{cantidad}</span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={cerrar} className={boton.secundario}>
                    Cancelar
                  </button>
                  <button className={boton.ia} disabled={trabajando || !peticion.trim()}>
                    {trabajando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                    {trabajando ? "Buscando…" : "Buscar cuentas"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4">
                <p className="flex items-center gap-2 text-sm font-bold" role="status">
                  {creados.length} cuentas añadidas como Nuevo <OrigenTag origen={resultado.modo} />
                </p>
                <ul className="mt-3 divide-y divide-linea rounded-xl border border-linea">
                  {creados.map((l) => (
                    <li key={l.id} className="p-3">
                      <Link href={`/leads/${l.id}`} onClick={cerrar} className="text-sm font-bold hover:underline">
                        {l.empresa}
                      </Link>
                      <p className="text-xs text-suave">
                        {l.sector} · {l.tamano} empleados · {l.ciudad}
                      </p>
                      {l.necesidad && <p className="mt-1 text-xs italic text-suave">«{l.necesidad}»</p>}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button onClick={() => setResultado(null)} className={boton.secundario}>
                    Otra búsqueda
                  </button>
                  <button
                    onClick={() => {
                      creados.forEach((l) => ejecutarAgentes(l.id));
                      cerrar();
                    }}
                    className={boton.ia}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" /> Preparar todas con agentes
                  </button>
                </div>
              </div>
            )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
