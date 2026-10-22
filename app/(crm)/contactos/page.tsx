"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import { puntuar } from "../../lib/puntuacion";
import { useCRM, useLeadsVisibles } from "../../lib/store";
import { EtapaBadge, Iniciales, Tarjeta, campo, hace } from "../../components/ui";

export default function Contactos() {
  const leads = useLeadsVisibles();
  const ajustes = useCRM((s) => s.ajustes);
  const [q, setQ] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);

  const filas = useMemo(
    () =>
      leads
        .filter((l) => !q.trim() || `${l.contacto.nombre} ${l.contacto.cargo} ${l.empresa}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.contacto.nombre.localeCompare(b.contacto.nombre, "es")),
    [leads, q]
  );

  const copiar = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(email);
      setTimeout(() => setCopiado(null), 1200);
    } catch {}
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Contactos</h1>
      <p className="mt-1 text-sm text-suave">Las personas de cada cuenta y su peso en la decisión de compra.</p>
      <input className={`${campo} mt-5 max-w-md`} placeholder="Buscar por nombre, cargo o empresa" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar contactos" />
      <Tarjeta className="mt-4 overflow-hidden">
        {filas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-sm text-suave">
            <Users className="h-8 w-8 text-tenue" aria-hidden="true" /> Sin contactos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-linea bg-hundido/60 text-left text-xs font-bold text-suave">
                <tr>
                  <th className="px-4 py-2.5">Persona</th>
                  <th className="px-3 py-2.5">Empresa</th>
                  <th className="px-3 py-2.5">Peso en la decisión</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Etapa</th>
                  <th className="px-4 py-2.5 text-right">Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {filas.map((l) => {
                  const factor = puntuar(l, ajustes).factores[3];
                  const peso = factor.puntos >= 20 ? "Decide" : factor.puntos >= 12 ? "Influye" : "Por confirmar";
                  return (
                    <tr key={l.id} className="transition hover:bg-hundido/50">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-3">
                          <Iniciales nombre={l.contacto.nombre} />
                          <span className="min-w-0">
                            <span className="block truncate font-bold">{l.contacto.nombre}</span>
                            <span className="block truncate text-xs text-suave">{l.contacto.cargo}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link href={`/leads/${l.id}`} className="font-semibold text-marca hover:underline">
                          {l.empresa}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                            peso === "Decide" ? "bg-marca-clara text-marca-oscura" : peso === "Influye" ? "bg-ambar-clara text-ambar" : "bg-hundido text-suave"
                          }`}
                        >
                          {peso}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {l.contacto.email ? (
                          <button onClick={() => copiar(l.contacto.email)} className="inline-flex items-center gap-1.5 text-suave hover:text-tinta" title="Copiar email">
                            {l.contacto.email}
                            {copiado === l.contacto.email ? <Check className="h-3 w-3 text-marca" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
                          </button>
                        ) : (
                          <span className="text-tenue">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <EtapaBadge etapa={l.etapa} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-tenue">{hace(l.actualizado)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
