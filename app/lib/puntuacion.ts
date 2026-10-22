import { ETAPAS, PRODUCTOS } from "./catalogo";
import type { Ajustes, Lead, Probabilidad, Puntuacion } from "./tipos";

// Puntuación de encaje con el cliente ideal (ICP). Es determinista y explicable a propósito:
// el comercial ve qué suma cada factor y puede discutirlo, en lugar de una "caja negra".

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function coincidenciasProducto(texto: string): Record<string, number> {
  const t = normalizar(texto);
  return Object.fromEntries(
    PRODUCTOS.map((p) => [p.id, p.palabrasClave.filter((k) => t.includes(normalizar(k))).length])
  );
}

export function puntuar(lead: Lead, ajustes: Ajustes): Puntuacion {
  const { icp } = ajustes;
  const factores = [];

  const enSector = icp.sectores.includes(lead.sector);
  factores.push({ etiqueta: enSector ? `Sector objetivo (${lead.sector})` : `Sector fuera del perfil (${lead.sector})`, puntos: enSector ? 25 : 5, max: 25 });

  const puntosTamano = icp.tamanos.includes(lead.tamano) ? 20 : lead.tamano === "1000+" ? 12 : 4;
  factores.push({ etiqueta: `Tamaño: ${lead.tamano} empleados`, puntos: puntosTamano, max: 20 });

  const coincidencias = Object.values(coincidenciasProducto(`${lead.necesidad} ${lead.notas}`)).reduce((a, b) => a + b, 0);
  const puntosNecesidad = coincidencias >= 3 ? 25 : coincidencias === 2 ? 18 : coincidencias === 1 ? 12 : lead.necesidad.trim() ? 5 : 0;
  factores.push({
    etiqueta: coincidencias ? "La necesidad encaja con el catálogo" : lead.necesidad.trim() ? "Necesidad poco concreta" : "Sin necesidad declarada",
    puntos: puntosNecesidad,
    max: 25,
  });

  const cargo = normalizar(lead.contacto.cargo);
  // Dirección decide; responsables y jefes de área influyen
  const decide = /(director|directora|ceo|coo|cfo|gerente|head|propietari|general)/.test(cargo);
  const influye = !decide && icp.cargosDecisores.some((c) => cargo.includes(normalizar(c)));
  factores.push({
    etiqueta: decide ? "Contacto que decide la compra" : influye ? "Contacto que influye en la compra" : "Contacto sin peso claro en la decisión",
    puntos: decide ? 20 : influye ? 12 : 4,
    max: 20,
  });

  const avance = { nuevo: 0, contactado: 3, cualificado: 6, propuesta: 10, ganado: 10, perdido: 0 }[lead.etapa];
  factores.push({ etiqueta: "Avance en el embudo", puntos: avance, max: 10 });

  const total = Math.min(100, factores.reduce((n, f) => n + f.puntos, 0));
  return { total, nivel: total >= 70 ? "alta" : total >= 45 ? "media" : "baja", factores };
}

export function valorPonderado(lead: Lead): number {
  const p = ETAPAS.find((e) => e.id === lead.etapa)?.probabilidad ?? 0;
  return lead.valor * p;
}

// Probabilidad de cierre: parte de la tasa típica de cada etapa y la ajusta con señales visibles.
// Sustituye a un modelo opaco: cada ajuste se muestra con su motivo.
export function probabilidadCierre(lead: Lead, ajustes: Ajustes): Probabilidad {
  if (lead.etapa === "ganado") return { valor: 100, factores: [{ etiqueta: "Ganado", efecto: 100 }] };
  if (lead.etapa === "perdido") return { valor: 0, factores: [{ etiqueta: "Perdido", efecto: 0 }] };
  const base = { nuevo: 8, contactado: 15, cualificado: 30, propuesta: 50 }[lead.etapa];
  const factores: { etiqueta: string; efecto: number }[] = [{ etiqueta: `Base de la etapa ${lead.etapa}`, efecto: base }];
  const p = puntuar(lead, ajustes);
  const porEncaje = Math.max(-15, Math.min(15, Math.round((p.total - 60) / 2)));
  if (porEncaje) factores.push({ etiqueta: porEncaje > 0 ? "Encaje alto con el cliente ideal" : "Encaje bajo con el cliente ideal", efecto: porEncaje });
  const dias = (Date.now() - new Date(lead.actualizado).getTime()) / 86400000;
  if (dias > 30) factores.push({ etiqueta: "Sin actividad hace más de 30 días", efecto: -10 });
  else if (dias > 14) factores.push({ etiqueta: "Sin actividad hace más de 14 días", efecto: -5 });
  if (lead.siguienteFecha && lead.siguienteFecha < new Date().toISOString().slice(0, 10)) factores.push({ etiqueta: "Siguiente paso vencido", efecto: -5 });
  if (lead.borrador?.estado === "aprobado") factores.push({ etiqueta: "Primer contacto enviado", efecto: 3 });
  const valor = Math.max(2, Math.min(95, factores.reduce((n, f) => n + f.efecto, 0)));
  return { valor, factores };
}

export function valorPonderadoProbable(lead: Lead, ajustes: Ajustes): number {
  return (lead.valor * probabilidadCierre(lead, ajustes).valor) / 100;
}
