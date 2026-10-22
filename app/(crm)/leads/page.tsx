"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, FileUp, Inbox, Radar, SearchX } from "lucide-react";
import { ETAPAS, SECTORES, producto } from "../../lib/catalogo";
import { probabilidadCierre, puntuar } from "../../lib/puntuacion";
import { useCRM, useLeadsVisibles, useUsuario } from "../../lib/store";
import Prospector from "../../components/Prospector";
import ImportarCSV from "../../components/ImportarCSV";
import type { Etapa } from "../../lib/tipos";
import { EtapaBadge, Iniciales, NivelBadge, PuntuacionAnillo, Tarjeta, boton, campo, euros, hace } from "../../components/ui";

type Orden = "encaje" | "valor" | "actividad";

function Lista() {
  const params = useSearchParams();
  const leads = useLeadsVisibles();
  const ajustes = useCRM((s) => s.ajustes);
  const usuarios = useCRM((s) => s.usuarios);
  const yo = useUsuario();
  const [responsable, setResponsable] = useState("");
  const [modal, setModal] = useState<"prospector" | "csv" | null>(null);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [etapa, setEtapa] = useState<Etapa | "">("");
  const [sector, setSector] = useState("");
  const [orden, setOrden] = useState<Orden>("encaje");

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return leads
      .filter((l) => !t || `${l.empresa} ${l.contacto.nombre} ${l.ciudad}`.toLowerCase().includes(t))
      .filter((l) => !etapa || l.etapa === etapa)
      .filter((l) => !sector || l.sector === sector)
      .filter((l) => !responsable || l.responsableId === responsable)
      .map((l) => ({ l, p: puntuar(l, ajustes) }))
      .sort((a, b) =>
        orden === "encaje" ? b.p.total - a.p.total : orden === "valor" ? b.l.valor - a.l.valor : b.l.actualizado.localeCompare(a.l.actualizado)
      );
  }, [leads, ajustes, q, etapa, sector, orden, responsable]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-suave">
            {leads.length} {yo.rol === "admin" ? "en todo el equipo" : "asignados a ti"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal("csv")} className={boton.secundario}>
            <FileUp className="h-4 w-4" aria-hidden="true" /> Importar CSV
          </button>
          <button onClick={() => setModal("prospector")} className={boton.ia}>
            <Radar className="h-4 w-4" aria-hidden="true" /> Buscar con IA
          </button>
        </div>
      </div>
      <Prospector abierto={modal === "prospector"} onCerrar={() => setModal(null)} />
      <ImportarCSV abierto={modal === "csv"} onCerrar={() => setModal(null)} />

      <div className={`mt-5 grid gap-2 ${yo.rol === "admin" ? "sm:grid-cols-[1fr_auto_auto_auto_auto]" : "sm:grid-cols-[1fr_auto_auto_auto]"}`}>
        <label className="sr-only" htmlFor="filtro-texto">
          Buscar
        </label>
        <input id="filtro-texto" className={campo} placeholder="Buscar por empresa, contacto o ciudad" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={campo} value={etapa} onChange={(e) => setEtapa(e.target.value as Etapa | "")} aria-label="Filtrar por etapa">
          <option value="">Todas las etapas</option>
          {ETAPAS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <select className={campo} value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Filtrar por sector">
          <option value="">Todos los sectores</option>
          {SECTORES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {yo.rol === "admin" && (
          <select className={campo} value={responsable} onChange={(e) => setResponsable(e.target.value)} aria-label="Filtrar por responsable">
            <option value="">Todo el equipo</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        )}
        <div className="relative">
          <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" aria-hidden="true" />
          <select className={`${campo} pl-9`} value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Ordenar">
            <option value="encaje">Más encaje</option>
            <option value="valor">Más valor</option>
            <option value="actividad">Actividad reciente</option>
          </select>
        </div>
      </div>

      <Tarjeta className="mt-4 overflow-hidden">
        {filas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-suave">
            <SearchX className="h-8 w-8 text-tenue" aria-hidden="true" />
            No hay leads con esos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-linea bg-hundido/60 text-left text-xs font-bold text-suave">
                <tr>
                  <th className="px-4 py-2.5">Empresa</th>
                  <th className="px-3 py-2.5">Encaje</th>
                  <th className="px-3 py-2.5">Etapa</th>
                  <th className="px-3 py-2.5">Recomendación</th>
                  <th className="px-3 py-2.5 text-right">Cierre</th>
                  <th className="px-3 py-2.5 text-right">Valor</th>
                  <th className="px-4 py-2.5 text-right">Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {filas.map(({ l, p }) => (
                  <tr key={l.id} className="transition hover:bg-hundido/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/leads/${l.id}`} className="flex items-center gap-3">
                        <Iniciales nombre={l.empresa} />
                        <span className="min-w-0">
                          <span className="block truncate font-bold hover:underline">{l.empresa}</span>
                          <span className="block truncate text-xs text-suave">
                            {l.sector} · {l.ciudad}
                            {yo.rol === "admin" && ` · ${usuarios.find((u) => u.id === l.responsableId)?.nombre.split(" ")[0] ?? ""}`}
                            {l.origenLead === "prospector" && " · Ficticia"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <PuntuacionAnillo p={p} tamano={34} />
                        <NivelBadge p={p} />
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <EtapaBadge etapa={l.etapa} />
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {l.recomendacion ? (
                        <span className="font-semibold">{producto(l.recomendacion.productoId)?.nombre}</span>
                      ) : (
                        <span className="text-tenue">Sin preparar</span>
                      )}
                      {l.borrador?.estado === "pendiente" && (
                        <span className="ml-2 inline-flex items-center gap-1 font-bold text-ia">
                          <Inbox className="h-3 w-3" aria-hidden="true" /> Email
                        </span>
                      )}
                    </td>
                    <td className="cifras px-3 py-2.5 text-right text-xs font-bold text-suave">{probabilidadCierre(l, ajustes).valor} %</td>
                    <td className="cifras px-3 py-2.5 text-right font-semibold">{euros(l.valor)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-tenue">{hace(l.actualizado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}

export default function Leads() {
  return (
    <Suspense>
      <Lista />
    </Suspense>
  );
}
