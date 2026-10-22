"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { useCRM, useLeadsVisibles, useUsuario } from "../../lib/store";
import { EtapaBadge, Iniciales, Tarjeta, campo, euros, hace } from "../../components/ui";

export default function Cuentas() {
  const leads = useLeadsVisibles();
  const usuarios = useCRM((s) => s.usuarios);
  const yo = useUsuario();
  const [q, setQ] = useState("");

  const cuentas = useMemo(() => {
    const porEmpresa = new Map<string, typeof leads>();
    for (const l of leads) porEmpresa.set(l.empresa, [...(porEmpresa.get(l.empresa) ?? []), l]);
    return [...porEmpresa.entries()]
      .map(([empresa, ls]) => {
        const reciente = [...ls].sort((a, b) => b.actualizado.localeCompare(a.actualizado))[0];
        return {
          empresa,
          principal: reciente,
          oportunidades: ls.length,
          abierto: ls.filter((l) => l.etapa !== "ganado" && l.etapa !== "perdido").reduce((n, l) => n + l.valor, 0),
          ganado: ls.filter((l) => l.etapa === "ganado").reduce((n, l) => n + l.valor, 0),
        };
      })
      .filter((c) => !q.trim() || `${c.empresa} ${c.principal.sector} ${c.principal.ciudad}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.principal.actualizado.localeCompare(a.principal.actualizado));
  }, [leads, q]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Cuentas</h1>
      <p className="mt-1 text-sm text-suave">Las empresas con las que trabajas y el valor de sus oportunidades.</p>
      <input className={`${campo} mt-5 max-w-md`} placeholder="Buscar por empresa, sector o ciudad" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cuentas" />
      <Tarjeta className="mt-4 overflow-hidden">
        {cuentas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-sm text-suave">
            <Building2 className="h-8 w-8 text-tenue" aria-hidden="true" /> Sin cuentas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-linea bg-hundido/60 text-left text-xs font-bold text-suave">
                <tr>
                  <th className="px-4 py-2.5">Empresa</th>
                  <th className="px-3 py-2.5">Sector y tamaño</th>
                  <th className="px-3 py-2.5">Etapa actual</th>
                  {yo.rol === "admin" && <th className="px-3 py-2.5">Responsable</th>}
                  <th className="px-3 py-2.5 text-right">Abierto</th>
                  <th className="px-3 py-2.5 text-right">Ganado</th>
                  <th className="px-4 py-2.5 text-right">Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {cuentas.map((c) => (
                  <tr key={c.empresa} className="transition hover:bg-hundido/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/leads/${c.principal.id}`} className="flex items-center gap-3">
                        <Iniciales nombre={c.empresa} />
                        <span className="min-w-0">
                          <span className="block truncate font-bold hover:underline">{c.empresa}</span>
                          <span className="block truncate text-xs text-marca">{c.principal.web.replace(/^https?:\/\//, "")}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className="block font-semibold">{c.principal.sector}</span>
                      <span className="text-suave">
                        {c.principal.tamano} empleados · {c.principal.ciudad}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <EtapaBadge etapa={c.principal.etapa} />
                    </td>
                    {yo.rol === "admin" && <td className="px-3 py-2.5 text-xs font-semibold">{usuarios.find((u) => u.id === c.principal.responsableId)?.nombre}</td>}
                    <td className="cifras px-3 py-2.5 text-right font-semibold">{c.abierto ? euros(c.abierto) : "—"}</td>
                    <td className="cifras px-3 py-2.5 text-right font-semibold text-marca-oscura">{c.ganado ? euros(c.ganado) : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-tenue">{hace(c.principal.actualizado)}</td>
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
