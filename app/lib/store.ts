"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useMemo, useState } from "react";
import { AJUSTES_INICIALES, etapaInfo } from "./catalogo";
import { leadsDemo, usuariosDemo } from "./datos-demo";
import { siguientePasoSugerido } from "./respaldo";
import type { Agente, Ajustes, Etapa, Evento, Lead, OrigenLead, RegistroAgente, Rol, Usuario } from "./tipos";

export const nuevoId = (prefijo = "") => `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type DatosLead = Pick<Lead, "empresa" | "web" | "sector" | "tamano" | "ciudad" | "contacto" | "necesidad" | "dolencia" | "notas" | "valor"> & {
  responsableId?: string;
  origenLead?: OrigenLead;
};

interface Estado {
  leads: Lead[];
  registro: RegistroAgente[];
  ajustes: Ajustes;
  usuarios: Usuario[];
  usuarioId: string;
  modalNuevo: boolean;
  ejecutando: Record<string, string | null>; // leadId → paso en curso

  abrirNuevo: (abierto: boolean) => void;
  crearLead: (datos: DatosLead) => string;
  crearLeads: (lista: DatosLead[]) => string[];
  actualizarLead: (id: string, cambio: Partial<Lead> | ((l: Lead) => Partial<Lead>)) => void;
  moverEtapa: (id: string, etapa: Etapa, autor?: Agente) => void;
  asignar: (id: string, usuarioId: string) => void;
  anadirEvento: (id: string, evento: Omit<Evento, "id" | "fecha">) => void;
  eliminarLead: (id: string) => void;
  registrar: (r: Omit<RegistroAgente, "id" | "fecha">) => void;
  setEjecutando: (id: string, paso: string | null) => void;
  setAjustes: (cambio: Partial<Ajustes>) => void;
  setUsuario: (id: string) => void;
  crearUsuario: (u: { nombre: string; email: string; rol: Rol }) => void;
  cambiarRol: (id: string, rol: Rol) => void;
  reiniciarDemo: () => void;
}

const ahora = () => new Date().toISOString();

function construir(datos: DatosLead, usuarioId: string): Lead {
  const id = nuevoId("L");
  return {
    ...datos,
    id,
    etapa: "nuevo",
    responsableId: datos.responsableId ?? usuarioId,
    origenLead: datos.origenLead ?? "manual",
    creado: ahora(),
    actualizado: ahora(),
    cerrado: null,
    siguienteFecha: null,
    investigacion: null,
    mapaEmpatia: null,
    recomendacion: null,
    borrador: null,
    siguientePaso: "Ejecutar los agentes para preparar la cuenta",
    eventos: [
      {
        id: nuevoId("e"),
        fecha: ahora(),
        tipo: "creado",
        texto: datos.origenLead === "prospector" ? "Lead propuesto por el agente prospector" : datos.origenLead === "importado" ? "Lead importado desde CSV" : "Lead creado",
        autor: datos.origenLead === "prospector" ? "prospector" : "humano",
      },
    ],
  };
}

const inicial = () => ({ ...leadsDemo(), ajustes: AJUSTES_INICIALES, usuarios: usuariosDemo(), usuarioId: "u1" });

export const useCRM = create<Estado>()(
  persist(
    (set, get) => ({
      ...inicial(),
      modalNuevo: false,
      ejecutando: {},

      abrirNuevo: (abierto) => set({ modalNuevo: abierto }),

      crearLead: (datos) => {
        const lead = construir(datos, get().usuarioId);
        set((s) => ({ leads: [lead, ...s.leads] }));
        return lead.id;
      },

      crearLeads: (lista) => {
        const nuevos = lista.map((d) => construir(d, get().usuarioId));
        set((s) => ({ leads: [...nuevos, ...s.leads] }));
        return nuevos.map((l) => l.id);
      },

      actualizarLead: (id, cambio) =>
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, ...(typeof cambio === "function" ? cambio(l) : cambio), actualizado: ahora() } : l)),
        })),

      moverEtapa: (id, etapa, autor = "humano") => {
        const lead = get().leads.find((l) => l.id === id);
        if (!lead || lead.etapa === etapa) return;
        const evento: Evento = { id: nuevoId("e"), fecha: ahora(), tipo: "etapa", texto: `${etapaInfo(lead.etapa).nombre} → ${etapaInfo(etapa).nombre}`, autor };
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== id) return l;
            const cerrado = etapa === "ganado" || etapa === "perdido" ? ahora() : null;
            const actualizado = { ...l, etapa, cerrado, actualizado: ahora(), eventos: [...l.eventos, evento] };
            return { ...actualizado, siguientePaso: siguientePasoSugerido(actualizado) };
          }),
        }));
      },

      asignar: (id, usuarioId) => {
        const u = get().usuarios.find((x) => x.id === usuarioId);
        if (!u) return;
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id
              ? { ...l, responsableId: usuarioId, actualizado: ahora(), eventos: [...l.eventos, { id: nuevoId("e"), fecha: ahora(), tipo: "nota", texto: `Asignado a ${u.nombre}`, autor: "humano" }] }
              : l
          ),
        }));
      },

      anadirEvento: (id, evento) =>
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, actualizado: ahora(), eventos: [...l.eventos, { ...evento, id: nuevoId("e"), fecha: ahora() }] } : l)),
        })),

      eliminarLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),

      registrar: (r) => set((s) => ({ registro: [{ ...r, id: nuevoId("r"), fecha: ahora() }, ...s.registro].slice(0, 500) })),

      setEjecutando: (id, paso) => set((s) => ({ ejecutando: { ...s.ejecutando, [id]: paso } })),

      setAjustes: (cambio) => set((s) => ({ ajustes: { ...s.ajustes, ...cambio } })),

      setUsuario: (id) => set({ usuarioId: id }),

      crearUsuario: (u) => set((s) => ({ usuarios: [...s.usuarios, { ...u, id: nuevoId("u") }] })),

      cambiarRol: (id, rol) => set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, rol } : u)) })),

      reiniciarDemo: () => set({ ...inicial(), ejecutando: {} }),
    }),
    {
      name: "rumbo-crm",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ leads: s.leads, registro: s.registro, ajustes: s.ajustes, usuarios: s.usuarios, usuarioId: s.usuarioId }),
      // Si cambia el modelo de datos, se vuelve a los datos de ejemplo
      migrate: () => inicial() as unknown as Estado,
      skipHydration: true,
    }
  )
);

// Hidratación controlada: la página no se pinta con datos de ejemplo y luego "salta" a los guardados
export function useHidratado() {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const p = useCRM.persist.rehydrate();
    Promise.resolve(p).finally(() => setListo(true));
  }, []);
  return listo;
}

export function useUsuario(): Usuario {
  const usuarios = useCRM((s) => s.usuarios);
  const id = useCRM((s) => s.usuarioId);
  return usuarios.find((u) => u.id === id) ?? usuarios[0];
}

// Cada comercial ve sus leads; la dirección comercial (admin) ve los de todo el equipo
export function useLeadsVisibles(): Lead[] {
  const leads = useCRM((s) => s.leads);
  const u = useUsuario();
  return useMemo(() => (u.rol === "admin" ? leads : leads.filter((l) => l.responsableId === u.id)), [leads, u]);
}

export function useRegistroVisible(): RegistroAgente[] {
  const registro = useCRM((s) => s.registro);
  const visibles = useLeadsVisibles();
  const u = useUsuario();
  return useMemo(() => {
    if (u.rol === "admin") return registro;
    const ids = new Set(visibles.map((l) => l.id));
    return registro.filter((r) => ids.has(r.leadId));
  }, [registro, visibles, u]);
}
