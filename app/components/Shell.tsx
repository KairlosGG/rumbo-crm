"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, BarChart3, BookOpen, Building2, Contact, Inbox, KanbanSquare, LayoutDashboard, Menu, Plus, Search, Settings, Users, X } from "lucide-react";
import { Iniciales, Logo, boton, campoBase } from "./ui";
import NuevoLead from "./NuevoLead";
import { useCRM, useHidratado, useLeadsVisibles, useUsuario } from "../lib/store";

const GRUPOS = [
  {
    titulo: "Trabajo",
    items: [
      { href: "/", nombre: "Panel", icono: LayoutDashboard },
      { href: "/pipeline", nombre: "Pipeline", icono: KanbanSquare },
      { href: "/leads", nombre: "Leads", icono: Users },
      { href: "/aprobaciones", nombre: "Aprobaciones", icono: Inbox },
    ],
  },
  {
    titulo: "Base de datos",
    items: [
      { href: "/cuentas", nombre: "Cuentas", icono: Building2 },
      { href: "/contactos", nombre: "Contactos", icono: Contact },
    ],
  },
  {
    titulo: "Análisis",
    items: [
      { href: "/analitica", nombre: "Analítica", icono: BarChart3 },
      { href: "/actividad", nombre: "Actividad de agentes", icono: Activity },
    ],
  },
  {
    titulo: "Sistema",
    items: [
      { href: "/como-funciona", nombre: "Cómo funciona", icono: BookOpen },
      { href: "/ajustes", nombre: "Ajustes", icono: Settings },
    ],
  },
];

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const ruta = usePathname();
  const pendientes = useLeadsVisibles().filter((l) => l.borrador?.estado === "pendiente").length;
  return (
    <nav aria-label="Principal" className="flex flex-col gap-4">
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-tenue">{g.titulo}</p>
          <div className="flex flex-col gap-0.5">
            {g.items.map(({ href, nombre, icono: Icono }) => {
              const activo = href === "/" ? ruta === "/" : ruta.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavegar}
                  aria-current={activo ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                    activo ? "bg-superficie text-tinta shadow-tarjeta" : "text-suave hover:bg-hundido hover:text-tinta"
                  }`}
                >
                  <Icono className={`h-[18px] w-[18px] ${activo ? "text-marca" : ""}`} aria-hidden="true" />
                  <span className="flex-1">{nombre}</span>
                  {href === "/aprobaciones" && pendientes > 0 && (
                    <span className="cifras rounded-full bg-ia px-1.5 py-0.5 text-[11px] font-bold text-white" aria-label={`${pendientes} pendientes`}>
                      {pendientes}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <Logo />
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight">Rumbo</span>
        <span className="block text-[11px] font-semibold text-tenue">CRM agéntico</span>
      </span>
    </Link>
  );
}

function AvisoDemo() {
  const empresa = useCRM((s) => s.ajustes.empresa);
  const usuarios = useCRM((s) => s.usuarios);
  const setUsuario = useCRM((s) => s.setUsuario);
  const yo = useUsuario();
  return (
    <div className="rounded-xl border border-linea bg-superficie p-3 text-xs leading-relaxed text-suave">
      <label htmlFor="usuario" className="font-bold text-tinta">
        Entrar como
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <Iniciales nombre={yo.nombre} className="h-7 w-7 text-[10px]" />
        <select id="usuario" className={`${campoBase} min-w-0 flex-1 py-1.5 text-xs font-semibold`} value={yo.id} onChange={(e) => setUsuario(e.target.value)}>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} · {u.rol === "admin" ? "Dirección" : "Comercial"}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2">
        {yo.rol === "admin" ? "Ves todo el equipo." : "Ves solo tus leads."} Demo de <span className="font-semibold text-tinta">{empresa}</span> con datos ficticios, guardados solo en tu navegador.
      </p>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const listo = useHidratado();
  const [menu, setMenu] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const abrirNuevo = useCRM((s) => s.abrirNuevo);
  const router = useRouter();
  const ruta = usePathname();

  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable) return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        abrirNuevo(true);
      }
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("busqueda-global")?.focus();
      }
    };
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, [abrirNuevo]);

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Barra lateral */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-5 overflow-y-auto border-r border-linea bg-fondo p-4 lg:flex">
        <Marca />
        <Navegacion />
        <div className="mt-auto">
          <AvisoDemo />
        </div>
      </aside>

      {/* Menú móvil */}
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-tinta/30" onClick={() => setMenu(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col gap-5 overflow-y-auto bg-fondo p-4 shadow-elevada"
            >
              <div className="flex items-center justify-between">
                <Marca />
                <button onClick={() => setMenu(false)} className={boton.fantasma} aria-label="Cerrar menú">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Navegacion onNavegar={() => setMenu(false)} />
              <div className="mt-auto">
                <AvisoDemo />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra superior */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-linea bg-fondo/85 px-3 py-2.5 backdrop-blur-md sm:px-6">
        <button onClick={() => setMenu(true)} className={`${boton.fantasma} lg:hidden`} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        <span className="lg:hidden">
          <Logo className="h-7 w-7" />
        </span>
        <form
          role="search"
          className="relative ml-1 max-w-md flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/leads?q=${encodeURIComponent(busqueda)}`);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" aria-hidden="true" />
          <label htmlFor="busqueda-global" className="sr-only">
            Buscar leads
          </label>
          <input
            id="busqueda-global"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar empresa o contacto…"
            className="w-full rounded-xl border border-linea bg-superficie py-2 pl-9 pr-10 text-sm outline-none transition placeholder:text-tenue focus:border-marca focus:ring-4 focus:ring-marca/10"
          />
          <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-linea px-1.5 text-[11px] text-tenue sm:block">/</kbd>
        </form>
        <button onClick={() => abrirNuevo(true)} className={`${boton.primario} ml-auto`} aria-label="Nuevo lead">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Nuevo lead</span>
          <kbd className="ml-1 hidden rounded bg-white/15 px-1.5 text-[11px] font-semibold sm:inline">N</kbd>
        </button>
      </header>

      <main key={ruta} className="mx-auto max-w-[1400px] px-3 py-5 sm:px-6 sm:py-7">
        {listo ? (
          children
        ) : (
          <div className="space-y-4" aria-label="Cargando">
            <div className="cargando h-8 w-56 rounded-lg" />
            <div className="grid gap-4 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="cargando h-24 rounded-2xl" />
              ))}
            </div>
            <div className="cargando h-80 rounded-2xl" />
          </div>
        )}
      </main>

      {listo && <NuevoLead />}
    </div>
  );
}
