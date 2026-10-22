"use client";

import { useMemo, useState } from "react";
import { ETAPAS, PRODUCTOS, SECTORES, TAMANOS } from "../../lib/catalogo";
import { valorPonderadoProbable } from "../../lib/puntuacion";
import { useCRM, useLeadsVisibles, useUsuario } from "../../lib/store";
import type { Lead } from "../../lib/tipos";
import { Iniciales, Tarjeta, euros } from "../../components/ui";

const DIA = 86400000;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function Barras({ titulo, nota, filas, formato = euros, color = "#0d7a68" }: { titulo: string; nota?: string; filas: { etiqueta: string; valor: number; extra?: string }[]; formato?: (n: number) => string; color?: string }) {
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <Tarjeta className="p-4 sm:p-5">
      <h2 className="font-extrabold">{titulo}</h2>
      {nota && <p className="text-xs text-tenue">{nota}</p>}
      <ul className="mt-4 space-y-3">
        {filas.map((f) => (
          <li key={f.etiqueta}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate font-bold">
                {f.etiqueta} {f.extra && <span className="font-semibold text-tenue">· {f.extra}</span>}
              </span>
              <span className="cifras shrink-0 font-semibold text-suave">{formato(f.valor)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-hundido">
              <div className="h-full rounded-full" style={{ width: `${(f.valor / max) * 100}%`, background: color }} />
            </div>
          </li>
        ))}
        {filas.length === 0 && <li className="text-sm text-tenue">Sin datos todavía.</li>}
      </ul>
    </Tarjeta>
  );
}

export default function Analitica() {
  const leads = useLeadsVisibles();
  const ajustes = useCRM((s) => s.ajustes);
  const usuarios = useCRM((s) => s.usuarios);
  const yo = useUsuario();
  const [ahora] = useState(() => Date.now());

  const d = useMemo(() => {
    const ganados = leads.filter((l) => l.etapa === "ganado");
    const perdidos = leads.filter((l) => l.etapa === "perdido");
    const cerrados = [...ganados, ...perdidos];
    const abiertos = leads.filter((l) => !cerrados.includes(l));
    const ciclo = media(ganados.filter((l) => l.cerrado).map((l) => (new Date(l.cerrado!).getTime() - new Date(l.creado).getTime()) / DIA));
    const ticket = media(ganados.map((l) => l.valor));
    const winRate = pct(ganados.length, cerrados.length);
    // Velocidad del pipeline: oportunidades abiertas × ticket medio × tasa de cierre / ciclo de venta (€ por día)
    const velocidad = ciclo ? (abiertos.length * ticket * (winRate / 100)) / ciclo : 0;

    const porVendedor = usuarios
      .map((u) => {
        const ls = leads.filter((l) => l.responsableId === u.id);
        return { u, ganado: ls.filter((l) => l.etapa === "ganado").reduce((n, l) => n + l.valor, 0), abiertos: ls.filter((l) => abiertos.includes(l)).length };
      })
      .filter((x) => x.ganado || x.abiertos);

    const sumaGanado = (f: (l: Lead) => boolean) => ganados.filter(f).reduce((n, l) => n + l.valor, 0);
    const productos = PRODUCTOS.map((p) => {
      const g = ganados.filter((l) => l.recomendacion?.productoId === p.id);
      return { etiqueta: p.nombre, valor: g.reduce((n, l) => n + l.valor, 0), extra: `${g.length} ventas` };
    }).sort((a, b) => b.valor - a.valor);

    const sectores = SECTORES.map((s) => {
      const cer = cerrados.filter((l) => l.sector === s);
      return { etiqueta: s, valor: sumaGanado((l) => l.sector === s), extra: cer.length ? `${pct(cer.filter((l) => l.etapa === "ganado").length, cer.length)} % de cierre` : undefined };
    })
      .filter((x) => x.valor || x.extra)
      .sort((a, b) => b.valor - a.valor);

    const tamanos = TAMANOS.map((t) => ({ etiqueta: t.etiqueta, valor: sumaGanado((l) => l.tamano === t.id) })).filter((x) => x.valor);

    const antiguedad = [
      ["Menos de 7 días", 0, 7],
      ["7 a 30 días", 7, 30],
      ["30 a 60 días", 30, 60],
      ["Más de 60 días", 60, Infinity],
    ].map(([etiqueta, min, max]) => ({
      etiqueta: etiqueta as string,
      valor: abiertos.filter((l) => {
        const dd = (ahora - new Date(l.creado).getTime()) / DIA;
        return dd >= (min as number) && dd < (max as number);
      }).length,
    }));

    const meses = Array.from({ length: 6 }, (_, i) => {
      const f = new Date();
      f.setDate(1);
      f.setMonth(f.getMonth() - (5 - i));
      const clave = f.toISOString().slice(0, 7);
      return {
        etiqueta: f.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""),
        nuevos: leads.filter((l) => l.creado.slice(0, 7) === clave).length,
        ganado: ganados.filter((l) => l.cerrado?.slice(0, 7) === clave).reduce((n, l) => n + l.valor, 0),
      };
    });

    const embudo = ETAPAS.filter((e) => e.id !== "perdido").map((e, i, arr) => {
      const alcanzaron = leads.filter((l) => {
        const orden = arr.findIndex((x) => x.id === l.etapa);
        return l.etapa === "perdido" ? i <= 3 && l.eventos.length > 1 : orden >= i;
      }).length;
      return { etiqueta: e.nombre, valor: alcanzaron };
    });

    return {
      ganados,
      perdidos,
      abiertos,
      ciclo,
      ticket,
      winRate,
      velocidad,
      conversion: pct(ganados.length, leads.length),
      ponderado: abiertos.reduce((n, l) => n + valorPonderadoProbable(l, ajustes), 0),
      porVendedor,
      productos,
      sectores,
      tamanos,
      antiguedad,
      meses,
      embudo,
    };
  }, [leads, usuarios, ajustes, ahora]);

  const kpis = [
    ["Tasa de conversión", `${d.conversion} %`, "Ganados sobre todos los leads"],
    ["Tasa de cierre", `${d.winRate} %`, `${d.ganados.length} ganados · ${d.perdidos.length} perdidos`],
    ["Ticket medio", euros(d.ticket), "Valor medio de lo ganado"],
    ["Ciclo de venta", `${Math.round(d.ciclo)} días`, "De la creación al cierre ganado"],
    ["Previsión ponderada", euros(d.ponderado), "Abierto × probabilidad de cierre"],
    ["Velocidad del pipeline", `${euros(d.velocidad)}/día`, "Abiertos × ticket × cierre ÷ ciclo"],
  ];
  const maxMes = Math.max(...d.meses.map((m) => m.ganado), 1);
  const maxEmbudo = Math.max(...d.embudo.map((e) => e.valor), 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Analítica</h1>
        <p className="mt-1 text-sm text-suave">{yo.rol === "admin" ? "Resultados de todo el equipo comercial." : "Tus resultados. La dirección comercial ve los del equipo."}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([t, v, n]) => (
          <Tarjeta key={t} className="p-4">
            <p className="text-xs font-bold text-suave">{t}</p>
            <p className="cifras mt-1.5 text-xl font-extrabold tracking-tight">{v}</p>
            <p className="mt-1 text-[11px] leading-snug text-tenue">{n}</p>
          </Tarjeta>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Tarjeta className="p-4 sm:p-5">
          <h2 className="font-extrabold">Últimos 6 meses</h2>
          <p className="text-xs text-tenue">Ingresos ganados por mes y leads nuevos</p>
          <div className="mt-5 flex items-end gap-3" role="img" aria-label="Gráfico de ingresos ganados por mes">
            {d.meses.map((m) => (
              <div key={m.etiqueta} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="cifras text-[11px] font-semibold text-suave">{m.ganado ? euros(m.ganado) : ""}</span>
                <div className="flex h-32 w-full items-end">
                  <div className="w-full rounded-t-lg bg-marca transition-all" style={{ height: `${Math.max(2, (m.ganado / maxMes) * 100)}%`, opacity: m.ganado ? 1 : 0.25 }} />
                </div>
                <span className="text-xs font-bold capitalize">{m.etiqueta}</span>
                <span className="cifras text-[11px] text-tenue">{m.nuevos} nuevos</span>
              </div>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta className="p-4 sm:p-5">
          <h2 className="font-extrabold">Embudo de conversión</h2>
          <p className="text-xs text-tenue">Leads que han llegado al menos a cada etapa</p>
          <ul className="mt-4 space-y-2">
            {d.embudo.map((e, i) => (
              <li key={e.etiqueta}>
                <div className="flex justify-between text-xs">
                  <span className="font-bold">{e.etiqueta}</span>
                  <span className="cifras font-semibold text-suave">
                    {e.valor}
                    {i > 0 && d.embudo[i - 1].valor ? ` · ${pct(e.valor, d.embudo[i - 1].valor)} % pasa` : ""}
                  </span>
                </div>
                <div className="mx-auto mt-1 h-6 rounded-md bg-marca/80" style={{ width: `${Math.max(6, (e.valor / maxEmbudo) * 100)}%`, opacity: 1 - i * 0.13 }} />
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {yo.rol === "admin" && (
          <Tarjeta className="p-4 sm:p-5">
            <h2 className="font-extrabold">Equipo</h2>
            <p className="text-xs text-tenue">Ingresos ganados y oportunidades abiertas</p>
            <ul className="mt-4 space-y-3">
              {d.porVendedor
                .sort((a, b) => b.ganado - a.ganado)
                .map(({ u, ganado, abiertos }) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <Iniciales nombre={u.nombre} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{u.nombre}</span>
                      <span className="text-xs text-suave">{abiertos} abiertas</span>
                    </span>
                    <span className="cifras text-sm font-bold">{euros(ganado)}</span>
                  </li>
                ))}
            </ul>
          </Tarjeta>
        )}
        <Barras titulo="Productos más vendidos" nota="Ingresos ganados por producto recomendado" filas={d.productos} />
        <Barras titulo="Rentabilidad por sector" nota="Ingresos ganados y tasa de cierre" filas={d.sectores} />
        <Barras titulo="Rentabilidad por tamaño" nota="Ingresos ganados según la plantilla del cliente" filas={d.tamanos} color="#3b82c4" />
        <Barras titulo="Antigüedad del pipeline" nota="Oportunidades abiertas según su edad" filas={d.antiguedad} formato={(n) => `${n}`} color="#b9760c" />
      </div>
    </div>
  );
}
