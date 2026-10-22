"use client";

import { useState } from "react";
import { RotateCcw, UserPlus } from "lucide-react";
import { PRODUCTOS, SECTORES, TAMANOS } from "../../lib/catalogo";
import { useCRM, useUsuario } from "../../lib/store";
import type { Rol, Tamano, Tono } from "../../lib/tipos";
import { Iniciales, Tarjeta, boton, campo, campoBase } from "../../components/ui";

export default function Ajustes() {
  const ajustes = useCRM((s) => s.ajustes);
  const set = useCRM((s) => s.setAjustes);
  const reiniciar = useCRM((s) => s.reiniciarDemo);
  const [confirmar, setConfirmar] = useState(false);
  const [hecho, setHecho] = useState(false);
  const usuarios = useCRM((s) => s.usuarios);
  const crearUsuario = useCRM((s) => s.crearUsuario);
  const cambiarRol = useCRM((s) => s.cambiarRol);
  const yo = useUsuario();
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", rol: "comercial" as Rol });
  const [errorUsuario, setErrorUsuario] = useState("");

  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-suave">Define a quién vendes y cómo hablan los agentes. Los cambios se aplican al momento.</p>
      </div>

      <Tarjeta className="p-5">
        <h2 className="font-extrabold">Cliente ideal (ICP)</h2>
        <p className="mt-1 text-sm text-suave">El analista usa este perfil para puntuar el encaje de cada lead.</p>
        <fieldset className="mt-4">
          <legend className="text-xs font-bold uppercase tracking-wider text-tenue">Sectores objetivo</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTORES.map((s) => {
              const on = ajustes.icp.sectores.includes(s);
              return (
                <button
                  key={s}
                  aria-pressed={on}
                  onClick={() => set({ icp: { ...ajustes.icp, sectores: alternar(ajustes.icp.sectores, s) } })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    on ? "border-marca bg-marca-clara text-marca-oscura" : "border-linea bg-superficie text-suave hover:text-tinta"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="text-xs font-bold uppercase tracking-wider text-tenue">Tamaños objetivo</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TAMANOS.map((t) => {
              const on = ajustes.icp.tamanos.includes(t.id);
              return (
                <button
                  key={t.id}
                  aria-pressed={on}
                  onClick={() => set({ icp: { ...ajustes.icp, tamanos: alternar<Tamano>(ajustes.icp.tamanos, t.id) } })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    on ? "border-marca bg-marca-clara text-marca-oscura" : "border-linea bg-superficie text-suave hover:text-tinta"
                  }`}
                >
                  {t.etiqueta}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="font-extrabold">Agentes</h2>
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[#0d7a68]"
            checked={ajustes.ejecutarAlCrear}
            onChange={(e) => set({ ejecutarAlCrear: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-bold">Preparar cada lead nuevo automáticamente</span>
            <span className="block text-xs text-suave">Al crearlo, se ejecutan investigador, analista, recomendador y redactor. El email siempre espera tu aprobación.</span>
          </span>
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-bold text-suave">Tono de los emails</span>
            <select className={campo} value={ajustes.tono} onChange={(e) => set({ tono: e.target.value as Tono })}>
              <option value="cercano">Cercano (tú)</option>
              <option value="formal">Formal (usted)</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-suave">Firma</span>
            <input className={campo} value={ajustes.firma} onChange={(e) => set({ firma: e.target.value })} />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-bold text-suave">Propuesta de valor de la empresa</span>
          <textarea className={`${campo} min-h-[70px]`} value={ajustes.propuesta} onChange={(e) => set({ propuesta: e.target.value })} />
        </label>
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="font-extrabold">Catálogo</h2>
        <p className="mt-1 text-sm text-suave">Lo que el recomendador puede proponer. En esta demo es fijo.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {PRODUCTOS.map((p) => (
            <li key={p.id} className="rounded-xl border border-linea p-3">
              <p className="font-bold">{p.nombre}</p>
              <p className="mt-1 text-xs leading-relaxed text-suave">{p.descripcion}</p>
              <p className="mt-2 text-xs font-semibold text-marca-oscura">{p.precio}</p>
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="font-extrabold">Equipo</h2>
        <p className="mt-1 text-sm text-suave">
          {yo.rol === "admin"
            ? "Da de alta comerciales y define quién ve todo el equipo. Cada comercial ve solo sus leads."
            : "Solo la dirección comercial puede gestionar el equipo."}
        </p>
        <ul className="mt-4 divide-y divide-linea rounded-xl border border-linea">
          {usuarios.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <Iniciales nombre={u.nombre} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {u.nombre} {u.id === yo.id && <span className="font-semibold text-tenue">(tú)</span>}
                </span>
                <span className="block truncate text-xs text-suave">{u.email}</span>
              </span>
              <label className="sr-only" htmlFor={`rol-${u.id}`}>
                Rol de {u.nombre}
              </label>
              <select
                id={`rol-${u.id}`}
                className={`${campoBase} text-xs font-semibold`}
                value={u.rol}
                disabled={yo.rol !== "admin" || u.id === yo.id}
                onChange={(e) => cambiarRol(u.id, e.target.value as Rol)}
              >
                <option value="comercial">Comercial</option>
                <option value="admin">Dirección comercial</option>
              </select>
            </li>
          ))}
        </ul>
        {yo.rol === "admin" && (
          <form
            className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!nuevo.nombre.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo.email)) {
                setErrorUsuario("Indica un nombre y un email válido.");
                return;
              }
              if (usuarios.some((u) => u.email.toLowerCase() === nuevo.email.toLowerCase())) {
                setErrorUsuario("Ya hay alguien con ese email.");
                return;
              }
              crearUsuario({ nombre: nuevo.nombre.trim(), email: nuevo.email.trim(), rol: nuevo.rol });
              setNuevo({ nombre: "", email: "", rol: "comercial" });
              setErrorUsuario("");
            }}
          >
            <input className={campo} placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} aria-label="Nombre" />
            <input className={campo} placeholder="email@empresa.example" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} aria-label="Email" />
            <select className={campoBase} value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Rol })} aria-label="Rol">
              <option value="comercial">Comercial</option>
              <option value="admin">Dirección</option>
            </select>
            <button className={boton.primario}>
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Añadir
            </button>
            {errorUsuario && (
              <p role="alert" className="text-sm font-semibold text-rojo sm:col-span-4">
                {errorUsuario}
              </p>
            )}
          </form>
        )}
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="font-extrabold">Datos de la demo</h2>
        <p className="mt-1 text-sm text-suave">Todo se guarda solo en este navegador. Puedes volver al estado inicial cuando quieras.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {confirmar ? (
            <>
              <span className="text-sm">Se perderán tus cambios.</span>
              <button
                className={boton.primario}
                onClick={() => {
                  reiniciar();
                  setConfirmar(false);
                  setHecho(true);
                  setTimeout(() => setHecho(false), 2000);
                }}
              >
                Sí, restablecer
              </button>
              <button className={boton.fantasma} onClick={() => setConfirmar(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button className={boton.secundario} onClick={() => setConfirmar(true)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer datos de ejemplo
            </button>
          )}
          {hecho && (
            <span role="status" className="text-sm font-bold text-marca">
              Datos restablecidos
            </span>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}
