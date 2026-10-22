"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { GripVertical, Inbox, Sparkles } from "lucide-react";
import { ETAPAS, producto } from "../../lib/catalogo";
import { probabilidadCierre, puntuar } from "../../lib/puntuacion";
import { useCRM, useLeadsVisibles, useUsuario } from "../../lib/store";
import type { Ajustes, Etapa, Lead } from "../../lib/tipos";
import { Iniciales, PuntuacionAnillo, euros } from "../../components/ui";

function TarjetaLead({ lead, ajustes, arrastrando = false }: { lead: Lead; ajustes: Ajustes; arrastrando?: boolean }) {
  const p = puntuar(lead, ajustes);
  const ejecutando = useCRM((s) => s.ejecutando[lead.id]);
  const responsable = useCRM((s) => s.usuarios.find((u) => u.id === lead.responsableId));
  const yo = useUsuario();
  const hoy = new Date().toISOString().slice(0, 10);
  const rec = lead.recomendacion ? producto(lead.recomendacion.productoId) : null;
  return (
    <div className={`rounded-xl border border-linea bg-superficie p-3 shadow-tarjeta ${arrastrando ? "rotate-1 shadow-elevada ring-2 ring-marca/30" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/leads/${lead.id}`} className="block truncate text-sm font-bold hover:underline" onPointerDown={(e) => e.stopPropagation()}>
            {lead.empresa}
          </Link>
          <p className="truncate text-xs text-suave">
            {lead.contacto.nombre || "Sin contacto"}
            {lead.contacto.cargo ? ` · ${lead.contacto.cargo}` : ""}
          </p>
        </div>
        <PuntuacionAnillo p={p} tamano={34} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {rec && <span className="rounded-md bg-hundido px-1.5 py-0.5 text-[11px] font-bold text-suave">{rec.nombre.replace("Brisa ", "")}</span>}
        {lead.borrador?.estado === "pendiente" && (
          <span className="inline-flex items-center gap-1 rounded-md bg-ia-clara px-1.5 py-0.5 text-[11px] font-bold text-ia">
            <Inbox className="h-3 w-3" aria-hidden="true" /> Email por revisar
          </span>
        )}
        {ejecutando && (
          <span className="inline-flex items-center gap-1 rounded-md bg-ia-clara px-1.5 py-0.5 text-[11px] font-bold text-ia">
            <Sparkles className="h-3 w-3 animate-pulse" aria-hidden="true" /> Agentes trabajando
          </span>
        )}
        {lead.siguienteFecha && lead.siguienteFecha < hoy && lead.etapa !== "ganado" && lead.etapa !== "perdido" && (
          <span className="rounded-md bg-rojo-claro px-1.5 py-0.5 text-[11px] font-bold text-rojo">Paso vencido</span>
        )}
        <span className="cifras ml-auto text-xs font-bold">{euros(lead.valor)}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-linea pt-2 text-[11px] text-suave">
        {yo.rol === "admin" && responsable && (
          <span className="flex items-center gap-1.5" title={`Responsable: ${responsable.nombre}`}>
            <Iniciales nombre={responsable.nombre} className="h-5 w-5 text-[9px]" />
            {responsable.nombre.split(" ")[0]}
          </span>
        )}
        <span className="cifras ml-auto font-semibold">{probabilidadCierre(lead, ajustes).valor} % de cierre</span>
      </div>
    </div>
  );
}

function Arrastrable({ lead, ajustes }: { lead: Lead; ajustes: Ajustes }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id, data: { etapa: lead.etapa } });
  return (
    <div ref={setNodeRef} className={`group relative ${isDragging ? "opacity-30" : ""}`}>
      <button
        {...listeners}
        {...attributes}
        aria-label={`Mover ${lead.empresa}. Pulsa espacio para coger y las flechas para cambiar de columna`}
        className="absolute -left-1 top-3 z-10 flex h-7 w-5 cursor-grab items-center justify-center rounded text-tenue opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing max-sm:opacity-100"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <TarjetaLead lead={lead} ajustes={ajustes} />
      </div>
    </div>
  );
}

function Columna({ etapa, leads, ajustes }: { etapa: (typeof ETAPAS)[number]; leads: Lead[]; ajustes: Ajustes }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  const total = leads.reduce((n, l) => n + l.valor, 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={`Columna ${etapa.nombre}`}
      className={`flex w-[272px] shrink-0 flex-col rounded-2xl border p-2 transition ${isOver ? "border-marca/40 bg-marca-clara/60" : "border-transparent bg-hundido/70"}`}
    >
      <header className="flex items-center gap-2 px-1.5 pb-2 pt-1">
        <span className="h-2 w-2 rounded-full" style={{ background: etapa.color }} aria-hidden="true" />
        <h2 className="text-sm font-extrabold">{etapa.nombre}</h2>
        <span className="cifras rounded-full bg-superficie px-1.5 text-xs font-bold text-suave">{leads.length}</span>
        <span className="cifras ml-auto text-xs font-semibold text-tenue">{euros(total)}</span>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2">
        {leads.map((l) => (
          <Arrastrable key={l.id} lead={l} ajustes={ajustes} />
        ))}
        {leads.length === 0 && <p className="rounded-xl border-2 border-dashed border-linea p-4 text-center text-xs text-tenue">Arrastra aquí</p>}
      </div>
    </section>
  );
}

export default function Pipeline() {
  const leads = useLeadsVisibles();
  const ajustes = useCRM((s) => s.ajustes);
  const mover = useCRM((s) => s.moverEtapa);
  const [activo, setActivo] = useState<string | null>(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const alSoltar = (e: DragEndEvent) => {
    setActivo(null);
    if (e.over) mover(String(e.active.id), e.over.id as Etapa);
  };

  const leadActivo = leads.find((l) => l.id === activo);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-suave">Arrastra las oportunidades entre etapas. Cada cambio queda en el historial del lead.</p>
        </div>
      </div>
      <DndContext
        sensors={sensores}
        onDragStart={(e) => setActivo(String(e.active.id))}
        onDragEnd={alSoltar}
        onDragCancel={() => setActivo(null)}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Has cogido ${leads.find((l) => l.id === active.id)?.empresa}.`,
            onDragOver: ({ over }) => (over ? `Sobre la columna ${ETAPAS.find((e) => e.id === over.id)?.nombre}.` : "Fuera de las columnas."),
            onDragEnd: ({ over }) => (over ? `Movido a ${ETAPAS.find((e) => e.id === over.id)?.nombre}.` : "Sin cambios."),
            onDragCancel: () => "Movimiento cancelado.",
          },
        }}
      >
        <div className="sin-barra -mx-3 mt-5 flex gap-3 overflow-x-auto px-3 pb-4 sm:-mx-6 sm:px-6">
          {ETAPAS.map((e) => (
            <Columna
              key={e.id}
              etapa={e}
              ajustes={ajustes}
              leads={leads.filter((l) => l.etapa === e.id).sort((a, b) => puntuar(b, ajustes).total - puntuar(a, ajustes).total)}
            />
          ))}
        </div>
        <DragOverlay>{leadActivo ? <TarjetaLead lead={leadActivo} ajustes={ajustes} arrastrando /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
