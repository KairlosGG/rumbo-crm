"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Inbox, PenLine, ShieldCheck, X } from "lucide-react";
import { producto } from "../../lib/catalogo";
import { puntuar } from "../../lib/puntuacion";
import { aprobarEmail, descartarEmail } from "../../lib/acciones";
import { useCRM, useLeadsVisibles } from "../../lib/store";
import { OrigenTag, PuntuacionAnillo, Tarjeta, boton, hace } from "../../components/ui";

export default function Aprobaciones() {
  const leads = useLeadsVisibles();
  const ajustes = useCRM((s) => s.ajustes);
  const [abierto, setAbierto] = useState<string | null>(null);
  const pendientes = leads
    .filter((l) => l.borrador?.estado === "pendiente")
    .sort((a, b) => puntuar(b, ajustes).total - puntuar(a, ajustes).total);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Aprobaciones</h1>
      <p className="mt-1 text-sm text-suave">Ningún agente contacta con un cliente sin tu visto bueno. Revisa, edita o descarta.</p>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-linea bg-superficie p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-marca" aria-hidden="true" />
        <p className="text-suave">
          <span className="font-bold text-tinta">Humano en el bucle.</span> Los agentes proponen y tú decides. Cada aprobación, edición o descarte queda en el{" "}
          <Link href="/actividad" className="font-bold text-marca hover:underline">
            registro de actividad
          </Link>
          .
        </p>
      </div>

      {pendientes.length === 0 ? (
        <Tarjeta className="mt-5 flex flex-col items-center gap-2 p-12 text-center">
          <Inbox className="h-8 w-8 text-tenue" aria-hidden="true" />
          <p className="font-bold">Bandeja vacía</p>
          <p className="text-sm text-suave">Cuando los agentes preparen un email aparecerá aquí.</p>
        </Tarjeta>
      ) : (
        <ul className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {pendientes.map((l) => {
              const b = l.borrador!;
              const p = puntuar(l, ajustes);
              const desplegado = abierto === l.id;
              return (
                <motion.li key={l.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}>
                  <Tarjeta className="overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <PuntuacionAnillo p={p} tamano={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/leads/${l.id}`} className="font-extrabold hover:underline">
                            {l.empresa}
                          </Link>
                          <OrigenTag origen={b.origen} />
                          <span className="text-xs text-tenue">{hace(b.fecha)}</span>
                        </div>
                        <p className="truncate text-xs text-suave">
                          Para {l.contacto.nombre} · {producto(l.recomendacion?.productoId ?? "")?.nombre ?? "Sin recomendación"}
                        </p>
                        <p className="mt-2 text-sm font-bold">{b.asunto}</p>
                        <button
                          onClick={() => setAbierto(desplegado ? null : l.id)}
                          aria-expanded={desplegado}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-suave hover:text-tinta"
                        >
                          {desplegado ? "Ocultar mensaje" : "Leer mensaje"}
                          <ChevronDown className={`h-3.5 w-3.5 transition ${desplegado ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {desplegado && <p className="whitespace-pre-wrap border-t border-linea bg-hundido/50 px-4 py-3 text-sm leading-relaxed">{b.cuerpo}</p>}
                    <div className="flex flex-wrap gap-2 border-t border-linea px-4 py-3">
                      <button onClick={() => aprobarEmail(l.id)} className={boton.marca}>
                        <Check className="h-4 w-4" aria-hidden="true" /> Aprobar
                      </button>
                      <Link href={`/leads/${l.id}`} className={boton.secundario}>
                        <PenLine className="h-4 w-4" aria-hidden="true" /> Editar
                      </Link>
                      <button onClick={() => descartarEmail(l.id)} className={`${boton.fantasma} ml-auto`}>
                        <X className="h-4 w-4" aria-hidden="true" /> Descartar
                      </button>
                    </div>
                  </Tarjeta>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
