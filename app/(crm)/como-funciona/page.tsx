"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Eye, FileCheck2, Gauge, Mail, Radar, ScrollText, Search, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { DOLENCIAS, ETAPAS, PRODUCTOS, SECTORES, TAMANOS, producto } from "../../lib/catalogo";
import { probabilidadCierre, puntuar } from "../../lib/puntuacion";
import { recomendarSinIA } from "../../lib/respaldo";
import { useCRM } from "../../lib/store";
import type { Etapa, Lead, Tamano } from "../../lib/tipos";
import { NivelBadge, PuntuacionAnillo, Tarjeta, campo } from "../../components/ui";

const FLUJO = [
  { icono: Radar, nombre: "Prospector", hace: "Propone cuentas que encajan con un perfil", ia: true },
  { icono: Search, nombre: "Investigador", hace: "Ficha de cuenta, hipótesis, preguntas y mapa de empatía", ia: true },
  { icono: Gauge, nombre: "Analista", hace: "Puntúa el encaje con reglas que se pueden explicar", ia: false },
  { icono: Sparkles, nombre: "Recomendador", hace: "Afinidad con cada producto del catálogo", ia: true },
  { icono: Mail, nombre: "Redactor", hace: "Primer email personalizado y seguimiento", ia: true },
  { icono: UserCheck, nombre: "Tú", hace: "Revisas, editas, apruebas o descartas", ia: false },
];

const PRINCIPIOS = [
  { icono: ShieldCheck, titulo: "Humano en el bucle", texto: "Ningún agente contacta con un cliente. Todo lo que sale hacia fuera pasa por una persona." },
  { icono: Eye, titulo: "Explicable", texto: "La puntuación y la probabilidad de cierre muestran cada factor y cuánto suma o resta." },
  { icono: FileCheck2, titulo: "Etiquetado", texto: "Cada resultado indica si lo generó la IA, unas reglas o una persona." },
  { icono: ScrollText, titulo: "Trazable", texto: "El registro guarda quién hizo qué y cuándo, y se exporta para auditoría." },
];

export default function ComoFunciona() {
  const ajustes = useCRM((s) => s.ajustes);
  const [sim, setSim] = useState({
    sector: "Hostelería",
    tamano: "50-249" as Tamano,
    cargo: "Directora de operaciones",
    necesidad: "Hacemos los cuadrantes en Excel y fichamos en papel",
    etapa: "contactado" as Etapa,
  });

  const lead = useMemo<Lead>(
    () => ({
      id: "sim",
      empresa: "Empresa de prueba",
      web: "",
      sector: sim.sector,
      tamano: sim.tamano,
      ciudad: "",
      contacto: { nombre: "Persona de prueba", cargo: sim.cargo, email: "" },
      necesidad: sim.necesidad,
      dolencia: DOLENCIAS[0],
      notas: "",
      valor: 10000,
      etapa: sim.etapa,
      responsableId: "",
      origenLead: "manual",
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString(),
      cerrado: null,
      siguienteFecha: null,
      investigacion: null,
      mapaEmpatia: null,
      recomendacion: null,
      borrador: null,
      siguientePaso: "",
      eventos: [],
    }),
    [sim]
  );
  const p = puntuar(lead, ajustes);
  const prob = probabilidadCierre(lead, ajustes);
  const rec = recomendarSinIA(lead);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Cómo funciona</h1>
        <p className="mt-1 max-w-2xl text-sm text-suave">
          Rumbo reparte la prospección entre agentes especializados. Cada uno hace una tarea concreta, deja constancia de lo que ha hecho y la decisión final es siempre de una persona.
        </p>
      </div>

      <Tarjeta className="p-5">
        <h2 className="font-extrabold">El flujo de los agentes</h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {FLUJO.map(({ icono: Icono, nombre, hace, ia }, i) => (
            <li key={nombre} className="relative rounded-xl border border-linea p-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${ia ? "bg-ia-clara text-ia" : nombre === "Tú" ? "bg-marca-clara text-marca-oscura" : "bg-hundido text-suave"}`}>
                <Icono className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-2 text-sm font-extrabold">
                {i + 1}. {nombre}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-suave">{hace}</p>
              <p className="mt-2 text-[11px] font-bold text-tenue">{ia ? "IA con respaldo por reglas" : nombre === "Tú" ? "Decisión humana" : "Reglas"}</p>
              {i < FLUJO.length - 1 && <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-tenue lg:block" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </Tarjeta>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRINCIPIOS.map(({ icono: Icono, titulo, texto }) => (
          <Tarjeta key={titulo} className="p-4">
            <Icono className="h-5 w-5 text-marca" aria-hidden="true" />
            <p className="mt-2 font-extrabold">{titulo}</p>
            <p className="mt-1 text-sm leading-relaxed text-suave">{texto}</p>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta className="p-5">
        <h2 className="font-extrabold">Simulador</h2>
        <p className="mt-1 text-sm text-suave">Cambia los datos de un lead imaginario y mira cómo responden la puntuación, la recomendación y la probabilidad de cierre.</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid min-w-0 gap-3">
            <label>
              <span className="mb-1 block text-xs font-bold text-suave">Sector</span>
              <select className={campo} value={sim.sector} onChange={(e) => setSim({ ...sim, sector: e.target.value })}>
                {SECTORES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold text-suave">Tamaño</span>
              <select className={campo} value={sim.tamano} onChange={(e) => setSim({ ...sim, tamano: e.target.value as Tamano })}>
                {TAMANOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold text-suave">Cargo del contacto</span>
              <input className={campo} value={sim.cargo} onChange={(e) => setSim({ ...sim, cargo: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold text-suave">Lo que necesita</span>
              <textarea className={`${campo} min-h-[70px]`} value={sim.necesidad} onChange={(e) => setSim({ ...sim, necesidad: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold text-suave">Etapa</span>
              <select className={campo} value={sim.etapa} onChange={(e) => setSim({ ...sim, etapa: e.target.value as Etapa })}>
                {ETAPAS.filter((e) => e.id !== "ganado" && e.id !== "perdido").map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="min-w-0 space-y-4" aria-live="polite">
            <div className="flex items-center gap-4 rounded-2xl border border-linea p-4">
              <PuntuacionAnillo p={p} tamano={64} />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">Encaje {p.total}/100</p>
                <NivelBadge p={p} />
                <ul className="mt-2 space-y-0.5 text-xs text-suave">
                  {p.factores.map((f) => (
                    <li key={f.etiqueta} className="flex justify-between gap-2">
                      <span className="truncate">{f.etiqueta}</span>
                      <span className="cifras font-bold text-tinta">
                        +{f.puntos}/{f.max}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-linea p-4">
              <p className="font-extrabold">Recomendación: {producto(rec.productoId)?.nombre}</p>
              <ul className="mt-3 space-y-2">
                {PRODUCTOS.map((pr) => (
                  <li key={pr.id}>
                    <div className="flex justify-between text-xs">
                      <span className={pr.id === rec.productoId ? "font-extrabold" : "font-semibold text-suave"}>{pr.nombre}</span>
                      <span className="cifras font-bold text-suave">{rec.afinidad[pr.id]} %</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hundido">
                      <div className={`h-full rounded-full transition-all ${pr.id === rec.productoId ? "bg-marca" : "bg-tenue/50"}`} style={{ width: `${rec.afinidad[pr.id]}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-tenue">En el simulador se usa la versión con reglas. En los leads, el recomendador usa IA y estas reglas como respaldo.</p>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-linea p-4">
              <p className="font-extrabold">Probabilidad de cierre</p>
              <p className="cifras text-2xl font-extrabold text-marca-oscura">{prob.valor} %</p>
            </div>
          </div>
        </div>
      </Tarjeta>
      <Tarjeta className="p-5">
        <h2 className="font-extrabold">Datos y privacidad en esta demo</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-suave">
          <li>
            <span className="font-bold text-tinta">Dónde se guardan.</span> Leads, ajustes y registro viven solo en tu navegador. No hay base de datos ni cuentas de usuario: el selector «Entrar como» simula los roles.
          </li>
          <li>
            <span className="font-bold text-tinta">Qué se envía a la IA.</span> Cuando ejecutas un agente, el servidor manda a Gemini los datos de ese lead (empresa, sector, tamaño, cargo, necesidad y notas) y la configuración comercial. No se envía nada más.
          </li>
          <li>
            <span className="font-bold text-tinta">Solo datos ficticios.</span> La demo usa el nivel gratuito de Gemini, en el que Google puede usar el contenido para mejorar sus productos. No introduzcas datos de personas o empresas reales.
          </li>
          <li>
            <span className="font-bold text-tinta">Nada sale hacia fuera.</span> No se envía ningún email: aprobar un borrador solo lo registra.
          </li>
        </ul>
      </Tarjeta>
    </div>
  );
}
