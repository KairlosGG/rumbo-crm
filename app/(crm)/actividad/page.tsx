"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { useRegistroVisible } from "../../lib/store";
import type { Agente } from "../../lib/tipos";
import { OrigenTag, Tarjeta, boton, campoBase, fechaCorta } from "../../components/ui";

const NOMBRES: Record<Agente, string> = {
  investigador: "Investigador",
  analista: "Analista",
  recomendador: "Recomendador",
  redactor: "Redactor",
  prospector: "Prospector",
  humano: "Persona",
};

export default function Actividad() {
  const registro = useRegistroVisible();
  const [agente, setAgente] = useState<Agente | "">("");
  const [modo, setModo] = useState("");

  const filas = useMemo(() => registro.filter((r) => (!agente || r.agente === agente) && (!modo || r.modo === modo)), [registro, agente, modo]);
  const ia = registro.filter((r) => r.modo === "ia").length;
  const humanas = registro.filter((r) => r.modo === "humano");
  const editadas = humanas.filter((r) => r.accion.includes("editado")).length;

  const exportar = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      ["fecha", "agente", "modo", "lead", "empresa", "accion", "detalle", "duracion_ms"].join(","),
      ...filas.map((r) => [r.fecha, r.agente, r.modo, r.leadId, r.empresa, r.accion, r.detalle, r.duracionMs].map(esc).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "registro-agentes.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Actividad de agentes</h1>
          <p className="mt-1 text-sm text-suave">Qué hizo cada agente, con IA o con reglas, y qué decidiste tú. Exportable para auditoría.</p>
        </div>
        <button onClick={exportar} className={boton.secundario}>
          <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Acciones registradas", registro.length],
          ["Con IA", ia],
          ["Decisiones humanas", humanas.length],
          ["Emails editados antes de aprobar", editadas],
        ].map(([t, v]) => (
          <Tarjeta key={t} className="p-4">
            <p className="text-xs font-bold text-suave">{t}</p>
            <p className="cifras mt-1 text-2xl font-extrabold">{v}</p>
          </Tarjeta>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <select className={`${campoBase}`} value={agente} onChange={(e) => setAgente(e.target.value as Agente | "")} aria-label="Filtrar por agente">
          <option value="">Todos los agentes</option>
          {Object.entries(NOMBRES).map(([id, n]) => (
            <option key={id} value={id}>
              {n}
            </option>
          ))}
        </select>
        <select className={`${campoBase}`} value={modo} onChange={(e) => setModo(e.target.value)} aria-label="Filtrar por modo">
          <option value="">IA, reglas y personas</option>
          <option value="ia">Solo IA</option>
          <option value="reglas">Solo reglas</option>
          <option value="humano">Solo personas</option>
        </select>
      </div>

      <Tarjeta className="mt-4 overflow-hidden">
        {filas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-sm text-suave">
            <ScrollText className="h-8 w-8 text-tenue" aria-hidden="true" /> Sin actividad con esos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-linea bg-hundido/60 text-left text-xs font-bold text-suave">
                <tr>
                  <th className="px-4 py-2.5">Cuándo</th>
                  <th className="px-3 py-2.5">Quién</th>
                  <th className="px-3 py-2.5">Qué</th>
                  <th className="px-3 py-2.5">Lead</th>
                  <th className="px-4 py-2.5 text-right">Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {filas.slice(0, 200).map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="cifras whitespace-nowrap px-4 py-2.5 text-xs text-suave">{fechaCorta(r.fecha)}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <OrigenTag origen={r.modo} />
                        <span className="font-semibold">{NOMBRES[r.agente]}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold">{r.accion}</p>
                      <p className="text-xs text-suave">{r.detalle}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/leads/${r.leadId}`} className="font-semibold text-marca hover:underline">
                        {r.empresa}
                      </Link>
                    </td>
                    <td className="cifras px-4 py-2.5 text-right text-xs text-tenue">{r.modo === "humano" ? "—" : `${(r.duracionMs / 1000).toFixed(1)} s`}</td>
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
