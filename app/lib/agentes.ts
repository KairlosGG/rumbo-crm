"use client";

import { DOLENCIAS, SECTORES, producto } from "./catalogo";
import { puntuar } from "./puntuacion";
import { investigarSinIA, mapaEmpatiaSinIA, prospectarSinIA, recomendarSinIA, redactarSinIA } from "./respaldo";
import { useCRM, type DatosLead } from "./store";
import type { Agente, Investigacion, Lead, MapaEmpatia, Origen, Recomendacion, Tamano } from "./tipos";

// Orquestador en el cliente: encadena los agentes, guarda cada resultado en el lead,
// deja constancia en el registro y termina siempre en la bandeja de aprobación humana.

export const PASOS: { id: Agente; nombre: string; hace: string }[] = [
  { id: "investigador", nombre: "Investigador", hace: "Prepara la ficha de cuenta" },
  { id: "analista", nombre: "Analista", hace: "Puntúa el encaje con el cliente ideal" },
  { id: "recomendador", nombre: "Recomendador", hace: "Elige el producto con más encaje" },
  { id: "redactor", nombre: "Redactor", hace: "Escribe el primer email" },
];

type Respuesta = { modo: Origen; datos?: Record<string, unknown>; modelo?: string; duracionMs?: number; motivo?: string };

export const MOTIVOS: Record<string, string> = {
  "sin-clave": "la IA no está configurada en este despliegue",
  limite: "has alcanzado el límite de uso de IA de la demo; prueba en unos minutos",
  cuota: "la cuota gratuita de la IA está al límite; prueba en un minuto",
  tiempo: "la IA tardó demasiado en responder",
  error: "la IA no respondió",
  red: "no hay conexión con el servidor",
};

const sinIA = (r: Respuesta) => (r.modo === "ia" ? "" : ` · Sin IA: ${MOTIVOS[r.motivo ?? "error"] ?? MOTIVOS.error}`);

async function llamar(tarea: string, lead: Lead, extra: Record<string, unknown> = {}): Promise<Respuesta> {
  const { ajustes } = useCRM.getState();
  try {
    const r = await fetch("/api/agente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tarea,
        lead: {
          empresa: lead.empresa,
          web: lead.web,
          sector: lead.sector,
          tamano: lead.tamano,
          ciudad: lead.ciudad,
          contacto: { nombre: lead.contacto.nombre, cargo: lead.contacto.cargo },
          necesidad: lead.necesidad,
          notas: lead.notas,
        },
        ajustes: { empresa: ajustes.empresa, propuesta: ajustes.propuesta, tono: ajustes.tono, firma: ajustes.firma },
        ...extra,
      }),
    });
    if (!r.ok) return { modo: "reglas", motivo: "error" };
    return (await r.json()) as Respuesta;
  } catch {
    return { modo: "reglas", motivo: "red" };
  }
}

const lista = (v: unknown, max = 5) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim()).slice(0, max) : [];

const leadActual = (id: string) => useCRM.getState().leads.find((l) => l.id === id);

export async function investigar(id: string) {
  const s = useCRM.getState();
  const lead = leadActual(id);
  if (!lead) return;
  s.setEjecutando(id, "investigador");
  const inicio = performance.now();
  const r = await llamar("investigar", lead);
  let inv: Investigacion = investigarSinIA(lead);
  let mapa: MapaEmpatia = mapaEmpatiaSinIA(lead);
  if (r.modo === "ia" && r.datos && typeof r.datos.resumen === "string") {
    const d = r.datos;
    inv = {
      resumen: String(d.resumen).trim(),
      senales: lista(d.senales),
      dolores: lista(d.dolores),
      preguntas: lista(d.preguntas),
      origen: "ia",
      fecha: new Date().toISOString(),
    };
    const m = d.mapaEmpatia as Record<string, unknown> | undefined;
    if (m && typeof m.piensa === "string") {
      const t = (k: string) => String(m[k] ?? "").trim();
      mapa = { piensa: t("piensa"), ve: t("ve"), oye: t("oye"), dice: t("dice"), esfuerzos: t("esfuerzos"), resultados: t("resultados"), origen: "ia", fecha: new Date().toISOString() };
    }
  }
  s.actualizarLead(id, { investigacion: inv, mapaEmpatia: mapa });
  s.registrar({
    agente: "investigador",
    leadId: id,
    empresa: lead.empresa,
    accion: "Ficha de cuenta y mapa de empatía",
    detalle: `${inv.dolores.length} hipótesis de dolor, ${inv.preguntas.length} preguntas de descubrimiento${sinIA(r)}`,
    modo: inv.origen,
    duracionMs: Math.round(performance.now() - inicio),
  });
}

export async function analizar(id: string) {
  const s = useCRM.getState();
  const lead = leadActual(id);
  if (!lead) return;
  s.setEjecutando(id, "analista");
  const inicio = performance.now();
  const p = puntuar(lead, s.ajustes);
  await new Promise((r) => setTimeout(r, 450)); // deja ver el paso en la interfaz
  s.registrar({
    agente: "analista",
    leadId: id,
    empresa: lead.empresa,
    accion: "Puntuación de encaje",
    detalle: `${p.total}/100 (${p.nivel}) · ${p.factores
      .filter((f) => f.puntos >= f.max * 0.6)
      .map((f) => f.etiqueta)
      .join(" · ") || "sin factores destacados"}`,
    modo: "reglas",
    duracionMs: Math.round(performance.now() - inicio),
  });
}

export async function recomendar(id: string) {
  const s = useCRM.getState();
  const lead = leadActual(id);
  if (!lead) return;
  s.setEjecutando(id, "recomendador");
  const inicio = performance.now();
  const r = await llamar("recomendar", lead);
  let rec: Recomendacion = recomendarSinIA(lead);
  if (r.modo === "ia" && r.datos && producto(String(r.datos.productoId))) {
    rec = {
      productoId: String(r.datos.productoId),
      afinidad: r.datos.afinidad as Record<string, number>,
      motivo: String(r.datos.motivo ?? "").trim(),
      origen: "ia",
      fecha: new Date().toISOString(),
    };
  }
  s.actualizarLead(id, { recomendacion: rec });
  s.registrar({
    agente: "recomendador",
    leadId: id,
    empresa: lead.empresa,
    accion: "Recomendación de producto",
    detalle: `${producto(rec.productoId)?.nombre} (${rec.afinidad[rec.productoId]} % de afinidad)${sinIA(r)}`,
    modo: rec.origen,
    duracionMs: Math.round(performance.now() - inicio),
  });
}

export async function redactar(id: string) {
  const s = useCRM.getState();
  const lead = leadActual(id);
  if (!lead) return;
  s.setEjecutando(id, "redactor");
  const inicio = performance.now();
  const p = producto(lead.recomendacion?.productoId ?? "turnos")!;
  const r = await llamar("redactar", lead, {
    investigacion: lead.investigacion ? `${lead.investigacion.resumen} Dolores: ${lead.investigacion.dolores.join("; ")}` : "",
    producto: `${p.nombre}: ${p.descripcion}`,
  });
  let borrador = redactarSinIA(lead, s.ajustes);
  if (r.modo === "ia" && r.datos && typeof r.datos.cuerpo === "string" && typeof r.datos.asunto === "string") {
    borrador = {
      asunto: r.datos.asunto.trim(),
      cuerpo: r.datos.cuerpo.trim(),
      seguimiento: String(r.datos.seguimiento ?? "").trim(),
      origen: "ia",
      fecha: new Date().toISOString(),
    };
  }
  s.actualizarLead(id, {
    borrador: { ...borrador, estado: "pendiente", editado: false, aviso: r.modo === "ia" ? undefined : MOTIVOS[r.motivo ?? "error"] ?? MOTIVOS.error },
    siguientePaso: "Revisar y aprobar el primer email",
  });
  s.registrar({
    agente: "redactor",
    leadId: id,
    empresa: lead.empresa,
    accion: "Borrador de primer contacto",
    detalle: `«${borrador.asunto}» · pendiente de aprobación humana${sinIA(r)}`,
    modo: borrador.origen,
    duracionMs: Math.round(performance.now() - inicio),
  });
}

export async function ejecutarAgentes(id: string) {
  const s = useCRM.getState();
  if (s.ejecutando[id]) return;
  try {
    await investigar(id);
    await analizar(id);
    await recomendar(id);
    await redactar(id);
    s.anadirEvento(id, { tipo: "agente", texto: "Los agentes han preparado la cuenta y un borrador de email", autor: "redactor" });
  } finally {
    useCRM.getState().setEjecutando(id, null);
  }
}

export async function reescribirEmail(id: string) {
  try {
    await redactar(id);
  } finally {
    useCRM.getState().setEjecutando(id, null);
  }
}

const TAMANOS_VALIDOS: Tamano[] = ["1-49", "50-249", "250-999", "1000+"];

const PISTAS: [RegExp, string][] = [
  [/fich|registro de jornada|papel/i, DOLENCIAS[1]],
  [/horas extra/i, DOLENCIAS[2]],
  [/baja|cobertur|sustitu|guardia|última hora/i, DOLENCIAS[3]],
  [/forma|onboarding|incorpora/i, DOLENCIAS[4]],
  [/rotaci/i, DOLENCIAS[5]],
  [/absentismo|datos|indicador/i, DOLENCIAS[6]],
  [/turno|cuadrante|horario|planific/i, DOLENCIAS[0]],
];

export function deducirDolencia(texto: string): string {
  return PISTAS.find(([re]) => re.test(texto))?.[1] ?? DOLENCIAS[DOLENCIAS.length - 1];
}

// Prospector: propone cuentas FICTICIAS que encajan con un perfil, para practicar el flujo sin datos reales.
export async function prospectar(peticion: string, cantidad: number): Promise<{ ids: string[]; modo: Origen }> {
  const s = useCRM.getState();
  const inicio = performance.now();
  let modo: Origen = "reglas";
  let lista: DatosLead[] = prospectarSinIA(peticion, cantidad);
  try {
    const r = await fetch("/api/agente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tarea: "prospectar", peticion, cantidad, sectores: SECTORES.join(", "), ajustes: { empresa: s.ajustes.empresa, propuesta: s.ajustes.propuesta } }),
    });
    const d = r.ok ? ((await r.json()) as Respuesta) : null;
    const empresas = d?.modo === "ia" && Array.isArray(d.datos?.empresas) ? (d.datos!.empresas as Record<string, unknown>[]) : [];
    const validas = empresas
      .filter((e) => typeof e.empresa === "string" && typeof e.contacto === "string")
      .slice(0, cantidad)
      .map((e): DatosLead => {
        const empresa = String(e.empresa).trim().slice(0, 80);
        const slug = empresa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "").slice(0, 18) || "empresa";
        const nombre = String(e.contacto).trim().slice(0, 60);
        const [n, a] = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" ");
        return {
          empresa,
          web: `https://${slug}.example`,
          sector: SECTORES.includes(String(e.sector)) ? String(e.sector) : "Retail",
          tamano: TAMANOS_VALIDOS.includes(e.tamano as Tamano) ? (e.tamano as Tamano) : "50-249",
          ciudad: String(e.ciudad ?? "").slice(0, 40),
          contacto: { nombre, cargo: String(e.cargo ?? "").slice(0, 60), email: `${(n ?? "contacto").replace(/[^a-z]/g, "")}.${(a ?? "").replace(/[^a-z]/g, "")}@${slug}.example` },
          necesidad: String(e.necesidad ?? "").slice(0, 300),
          dolencia: deducirDolencia(String(e.necesidad ?? "")),
          notas: "Cuenta ficticia propuesta por el agente prospector",
          valor: Math.max(500, Math.min(90000, Math.round(Number(e.valor) || 10000))),
          origenLead: "prospector",
        };
      });
    if (validas.length) {
      lista = validas;
      modo = "ia";
    }
  } catch {
    // se mantiene la lista generada con reglas
  }
  const ids = s.crearLeads(lista.map((l) => ({ ...l, origenLead: "prospector" })));
  for (const [i, id] of ids.entries()) {
    s.registrar({
      agente: "prospector",
      leadId: id,
      empresa: lista[i].empresa,
      accion: "Cuenta propuesta (ficticia)",
      detalle: `Perfil: «${peticion.slice(0, 80)}»`,
      modo,
      duracionMs: Math.round((performance.now() - inicio) / ids.length),
    });
  }
  return { ids, modo };
}
