"use client";

import { useCRM } from "./store";

// Decisiones humanas sobre lo que proponen los agentes. Quedan en el historial del lead y en el registro.

export function aprobarEmail(id: string) {
  const s = useCRM.getState();
  const lead = s.leads.find((l) => l.id === id);
  const b = lead?.borrador;
  if (!lead || !b || b.estado !== "pendiente") return;
  s.actualizarLead(id, (l) => ({ borrador: l.borrador ? { ...l.borrador, estado: "aprobado" } : null }));
  s.anadirEvento(id, { tipo: "email", texto: `Email aprobado${b.editado ? " con cambios" : ""}: «${b.asunto}»`, autor: "humano" });
  s.registrar({
    agente: "humano",
    leadId: id,
    empresa: lead.empresa,
    accion: b.editado ? "Email editado y aprobado" : "Email aprobado sin cambios",
    detalle: `Propuesto por el redactor (${b.origen === "ia" ? "IA" : "reglas"})`,
    modo: "humano",
    duracionMs: 0,
  });
  if (lead.etapa === "nuevo") s.moverEtapa(id, "contactado");
}

export function descartarEmail(id: string) {
  const s = useCRM.getState();
  const lead = s.leads.find((l) => l.id === id);
  const b = lead?.borrador;
  if (!lead || !b || b.estado !== "pendiente") return;
  s.actualizarLead(id, (l) => ({ borrador: l.borrador ? { ...l.borrador, estado: "descartado" } : null }));
  s.registrar({ agente: "humano", leadId: id, empresa: lead.empresa, accion: "Email descartado", detalle: `«${b.asunto}»`, modo: "humano", duracionMs: 0 });
}
