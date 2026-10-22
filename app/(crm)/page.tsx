"use client";

import Link from "next/link";
import { AlarmClock, ArrowRight, CalendarCheck, Inbox, Sparkles, Target, TrendingUp, Trophy } from "lucide-react";
import { ETAPAS } from "../lib/catalogo";
import { probabilidadCierre, puntuar, valorPonderadoProbable } from "../lib/puntuacion";
import { ejecutarAgentes } from "../lib/agentes";
import { useCRM, useLeadsVisibles, useRegistroVisible, useUsuario } from "../lib/store";
import { EtapaBadge, Iniciales, OrigenTag, PuntuacionAnillo, Tarjeta, boton, euros, hace } from "../components/ui";

export default function Panel() {
  const leads = useLeadsVisibles();
  const registro = useRegistroVisible();
  const yo = useUsuario();
  const hoy = new Date().toISOString().slice(0, 10);
  const ajustes = useCRM((s) => s.ajustes);
  const ejecutando = useCRM((s) => s.ejecutando);

  const abiertos = leads.filter((l) => l.etapa !== "ganado" && l.etapa !== "perdido");
  const ganados = leads.filter((l) => l.etapa === "ganado");
  const perdidos = leads.filter((l) => l.etapa === "perdido");
  const pendientes = leads.filter((l) => l.borrador?.estado === "pendiente");
  const sinPreparar = leads.filter((l) => l.etapa === "nuevo" && !l.investigacion);
  const pipeline = abiertos.reduce((n, l) => n + l.valor, 0);
  const ponderado = abiertos.reduce((n, l) => n + valorPonderadoProbable(l, ajustes), 0);
  const tareas = abiertos
    .filter((l) => l.siguienteFecha && l.siguienteFecha <= hoy)
    .sort((a, b) => (a.siguienteFecha ?? "").localeCompare(b.siguienteFecha ?? ""));
  const conversion = ganados.length + perdidos.length ? Math.round((ganados.length / (ganados.length + perdidos.length)) * 100) : 0;
  const prioridades = abiertos
    .map((l) => ({ l, p: puntuar(l, ajustes) }))
    .sort((a, b) => b.p.total - a.p.total || b.l.valor - a.l.valor)
    .slice(0, 6);
  const maxEtapa = Math.max(...ETAPAS.map((e) => leads.filter((l) => l.etapa === e.id).reduce((n, l) => n + l.valor, 0)), 1);

  const kpis = [
    { titulo: "Pipeline abierto", valor: euros(pipeline), nota: `${abiertos.length} oportunidades`, icono: Target },
    { titulo: "Previsión ponderada", valor: euros(ponderado), nota: "Valor × probabilidad de cierre", icono: TrendingUp },
    { titulo: "Tasa de cierre", valor: `${conversion} %`, nota: `${ganados.length} ganadas · ${perdidos.length} perdidas`, icono: Trophy },
    { titulo: "Esperan tu aprobación", valor: String(pendientes.length), nota: "Borradores de los agentes", icono: Inbox, href: "/aprobaciones" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Hola, {yo.nombre.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-suave">
          {yo.rol === "admin" ? "Visión de todo el equipo comercial." : "Esto es lo que tus agentes han preparado y lo que necesita tu decisión."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ titulo, valor, nota, icono: Icono, href }) => {
          const contenido = (
            <Tarjeta className={`h-full p-4 ${href ? "transition hover:border-ia/40" : ""}`}>
              <div className="flex items-center justify-between text-xs font-bold text-suave">
                {titulo}
                <Icono className={`h-4 w-4 ${href ? "text-ia" : "text-tenue"}`} aria-hidden="true" />
              </div>
              <p className="cifras mt-2 text-2xl font-extrabold tracking-tight">{valor}</p>
              <p className="mt-1 text-xs text-tenue">{nota}</p>
            </Tarjeta>
          );
          return href ? (
            <Link key={titulo} href={href} className="block">
              {contenido}
            </Link>
          ) : (
            <div key={titulo}>{contenido}</div>
          );
        })}
      </div>

      {tareas.length > 0 && (
        <Tarjeta className="p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-marca" aria-hidden="true" />
            <h2 className="font-extrabold">Para hoy</h2>
            <span className="cifras rounded-full bg-hundido px-1.5 text-xs font-bold text-suave">{tareas.length}</span>
          </div>
          <ul className="mt-3 grid min-w-0 gap-2 md:grid-cols-2">
            {tareas.map((l) => {
              const vencida = (l.siguienteFecha ?? "") < hoy;
              return (
                <li key={l.id} className="min-w-0">
                  <Link href={`/leads/${l.id}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-linea p-3 transition hover:bg-hundido">
                    {vencida ? (
                      <AlarmClock className="h-4 w-4 shrink-0 text-rojo" aria-hidden="true" />
                    ) : (
                      <CalendarCheck className="h-4 w-4 shrink-0 text-marca" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{l.siguientePaso}</span>
                      <span className="block truncate text-xs text-suave">{l.empresa}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-bold ${vencida ? "text-rojo" : "text-marca"}`}>{vencida ? "Vencida" : "Hoy"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Tarjeta className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Prioridades</h2>
            <Link href="/leads" className="text-xs font-bold text-marca hover:underline">
              Ver todos
            </Link>
          </div>
          <p className="text-xs text-tenue">Ordenadas por encaje con tu cliente ideal</p>
          <ul className="mt-3 divide-y divide-linea">
            {prioridades.map(({ l, p }) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-hundido">
                  <PuntuacionAnillo p={p} tamano={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{l.empresa}</p>
                    <p className="truncate text-xs text-suave">
                      {probabilidadCierre(l, ajustes).valor} % de cierre · {l.siguientePaso}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="cifras text-sm font-bold">{euros(l.valor)}</p>
                    <EtapaBadge etapa={l.etapa} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta className="p-4 sm:p-5">
          <h2 className="font-extrabold">Embudo</h2>
          <p className="text-xs text-tenue">Valor por etapa</p>
          <ul className="mt-4 space-y-3">
            {ETAPAS.map((e) => {
              const ls = leads.filter((l) => l.etapa === e.id);
              const v = ls.reduce((n, l) => n + l.valor, 0);
              return (
                <li key={e.id}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold">
                      {e.nombre} <span className="font-semibold text-tenue">· {ls.length}</span>
                    </span>
                    <span className="cifras font-semibold text-suave">{euros(v)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-hundido">
                    <div className="h-full rounded-full" style={{ width: `${(v / maxEtapa) * 100}%`, background: e.color }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Tarjeta className="p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ia" aria-hidden="true" />
            <h2 className="font-extrabold">Leads sin preparar</h2>
          </div>
          {sinPreparar.length === 0 ? (
            <p className="mt-3 text-sm text-suave">Todos los leads nuevos tienen ya su ficha. Crea uno con la tecla N.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sinPreparar.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-linea p-3">
                  <Iniciales nombre={l.empresa} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/leads/${l.id}`} className="block truncate text-sm font-bold hover:underline">
                      {l.empresa}
                    </Link>
                    <p className="truncate text-xs text-suave">
                      {l.sector} · {l.tamano} empleados
                    </p>
                  </div>
                  <button onClick={() => ejecutarAgentes(l.id)} disabled={!!ejecutando[l.id]} className={boton.ia}>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{ejecutando[l.id] ? "Preparando…" : "Preparar"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Actividad de los agentes</h2>
            <Link href="/actividad" className="text-xs font-bold text-marca hover:underline">
              Registro completo
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {registro.slice(0, 6).map((r) => (
              <li key={r.id} className="flex gap-3 text-sm">
                <OrigenTag origen={r.modo} />
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-bold">{r.accion}</span> · {r.empresa}
                  </p>
                  <p className="truncate text-xs text-tenue">{r.detalle}</p>
                </div>
                <span className="shrink-0 text-xs text-tenue">{hace(r.fecha)}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      {pendientes.length > 0 && (
        <Link href="/aprobaciones" className="flex items-center gap-3 rounded-2xl border border-ia/30 bg-ia-clara p-4 text-sm font-semibold text-ia transition hover:brightness-[0.98]">
          <Inbox className="h-5 w-5" aria-hidden="true" />
          <span className="flex-1">
            {pendientes.length === 1 ? "Hay 1 email" : `Hay ${pendientes.length} emails`} de los agentes esperando tu revisión antes de enviarse
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
