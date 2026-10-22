"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { DOLENCIAS, SECTORES, TAMANOS } from "../lib/catalogo";
import { ejecutarAgentes } from "../lib/agentes";
import { useCRM, useUsuario } from "../lib/store";
import type { Tamano } from "../lib/tipos";
import { boton, campo, useEscape } from "./ui";

const VACIO = {
  empresa: "",
  web: "",
  sector: "Retail",
  tamano: "50-249" as Tamano,
  ciudad: "",
  nombre: "",
  cargo: "",
  email: "",
  necesidad: "",
  dolencia: DOLENCIAS[0],
  notas: "",
  valor: "",
  responsableId: "",
};

const EJEMPLO = {
  empresa: "Gimnasios Altamar",
  web: "https://altamar.example",
  sector: "Servicios profesionales",
  tamano: "50-249" as Tamano,
  ciudad: "Alicante",
  nombre: "Clara Vidal",
  cargo: "Directora de operaciones",
  email: "clara.vidal@altamar.example",
  necesidad: "Doce centros con monitores a turnos y cada semana rehacemos el cuadrante a mano",
  dolencia: "Cuadrantes y turnos manuales",
  notas: "Vino desde el seminario web de planificación de turnos.",
  valor: "16000",
  responsableId: "",
};

export default function NuevoLead() {
  const abierto = useCRM((s) => s.modalNuevo);
  const abrir = useCRM((s) => s.abrirNuevo);
  const crear = useCRM((s) => s.crearLead);
  const ejecutarAlCrear = useCRM((s) => s.ajustes.ejecutarAlCrear);
  const usuarios = useCRM((s) => s.usuarios);
  const yo = useUsuario();
  const [f, setF] = useState(VACIO);
  const [error, setError] = useState("");
  const router = useRouter();

  const cerrar = () => {
    abrir(false);
    setError("");
  };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.empresa.trim()) {
      setError("Indica al menos el nombre de la empresa.");
      return;
    }
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      setError("El email no parece válido.");
      return;
    }
    const id = crear({
      empresa: f.empresa.trim(),
      web: f.web.trim(),
      sector: f.sector,
      tamano: f.tamano,
      ciudad: f.ciudad.trim(),
      contacto: { nombre: f.nombre.trim(), cargo: f.cargo.trim(), email: f.email.trim() },
      necesidad: f.necesidad.trim(),
      dolencia: f.dolencia,
      notas: f.notas.trim(),
      valor: Math.max(0, Number(f.valor) || 0),
      responsableId: f.responsableId || yo.id,
    });
    setF(VACIO);
    cerrar();
    router.push(`/leads/${id}`);
    if (ejecutarAlCrear) ejecutarAgentes(id);
  };

  const c = (k: keyof typeof VACIO) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }),
  });

  useEscape(abierto, cerrar);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px]" onClick={cerrar} />
          <motion.form
            onSubmit={guardar}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nuevo"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-superficie shadow-elevada sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-linea px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
              <div>
                <h2 id="titulo-nuevo" className="text-xl font-extrabold tracking-tight">
                  Nuevo lead
                </h2>
                <p className="mt-1 text-sm text-suave">
                  {ejecutarAlCrear ? "Al guardarlo, los agentes prepararán la ficha, la puntuación, la recomendación y un borrador de email." : "Podrás lanzar los agentes desde la ficha del lead."}
                </p>
              </div>
              <button type="button" onClick={cerrar} className={boton.fantasma} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="desplazable min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7">
            <button type="button" onClick={() => setF(EJEMPLO)} className="mt-4 text-xs font-bold text-ia hover:underline">
              Rellenar con un ejemplo
            </button>

            <fieldset className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-tenue">Empresa</legend>
              <Campo etiqueta="Nombre de la empresa *">
                <input className={campo} {...c("empresa")} autoFocus required />
              </Campo>
              <Campo etiqueta="Web">
                <input className={campo} {...c("web")} placeholder="https://" />
              </Campo>
              <Campo etiqueta="Sector">
                <select className={campo} {...c("sector")}>
                  {SECTORES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Tamaño">
                <select className={campo} {...c("tamano")}>
                  {TAMANOS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.etiqueta}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Ciudad">
                <input className={campo} {...c("ciudad")} />
              </Campo>
              <Campo etiqueta="Valor estimado (€/año)">
                <input className={campo} {...c("valor")} inputMode="numeric" placeholder="12000" />
              </Campo>
            </fieldset>

            <fieldset className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-tenue">Contacto</legend>
              <Campo etiqueta="Nombre">
                <input className={campo} {...c("nombre")} placeholder="Opcional" />
              </Campo>
              <Campo etiqueta="Cargo">
                <input className={campo} {...c("cargo")} />
              </Campo>
              <Campo etiqueta="Email">
                <input className={campo} {...c("email")} type="email" />
              </Campo>
            </fieldset>

            <fieldset className="mt-5 grid min-w-0 gap-3">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-tenue">Contexto</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Problema principal">
                  <select className={campo} {...c("dolencia")}>
                    {DOLENCIAS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Responsable">
                  <select className={campo} {...c("responsableId")} disabled={yo.rol !== "admin"}>
                    <option value="">{yo.nombre} (tú)</option>
                    {usuarios
                      .filter((u) => u.id !== yo.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre}
                        </option>
                      ))}
                  </select>
                </Campo>
              </div>
              <Campo etiqueta="¿Qué necesita, con sus palabras?">
                <textarea className={`${campo} min-h-[72px]`} {...c("necesidad")} placeholder="Lo que contó en el formulario, la llamada o el evento" />
              </Campo>
              <Campo etiqueta="Notas para contactar">
                <textarea className={`${campo} min-h-[56px]`} {...c("notas")} />
              </Campo>
            </fieldset>

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-rojo-claro px-3 py-2 text-sm font-semibold text-rojo">
                {error}
              </p>
            )}

            <p className="mt-4 text-xs text-tenue">Es una demo: usa datos inventados, no de personas reales.</p>
            </div>

            <div className="flex justify-end gap-2 border-t border-linea px-5 py-3 sm:px-7">
              <button type="button" onClick={cerrar} className={boton.secundario}>
                Cancelar
              </button>
              <button type="submit" className={ejecutarAlCrear ? boton.ia : boton.primario}>
                {ejecutarAlCrear && <Sparkles className="h-4 w-4" aria-hidden="true" />}
                {ejecutarAlCrear ? "Crear y preparar con agentes" : "Crear lead"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-suave">{etiqueta}</span>
      {children}
    </label>
  );
}
