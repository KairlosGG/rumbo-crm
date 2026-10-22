"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CircleDashed,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { DOLENCIAS, ETAPAS, PRODUCTOS, producto } from "../../../lib/catalogo";
import { probabilidadCierre, puntuar } from "../../../lib/puntuacion";
import { ejecutarAgentes, PASOS, reescribirEmail } from "../../../lib/agentes";
import { aprobarEmail, descartarEmail } from "../../../lib/acciones";
import { useCRM, useUsuario } from "../../../lib/store";
import type { Etapa, Lead } from "../../../lib/tipos";
import { Iniciales, NivelBadge, OrigenTag, PuntuacionAnillo, Tarjeta, boton, campo, campoBase, euros, fechaCorta } from "../../../components/ui";

function Ejecucion({ lead }: { lead: Lead }) {
  const paso = useCRM((s) => s.ejecutando[lead.id]);
  const idx = PASOS.findIndex((p) => p.id === paso);
  return (
    <AnimatePresence>
      {paso && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
          <Tarjeta className="border-ia/30 bg-ia-clara/40 p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-ia" role="status">
              <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" /> Los agentes están preparando la cuenta
            </p>
            <ol className="mt-3 grid gap-2 sm:grid-cols-4">
              {PASOS.map((p, i) => {
                const estado = i < idx ? "hecho" : i === idx ? "activo" : "pendiente";
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                      estado === "activo" ? "border-ia/40 bg-superficie shadow-tarjeta" : "border-transparent"
                    }`}
                  >
                    {estado === "hecho" ? (
                      <Check className="h-4 w-4 shrink-0 text-marca" strokeWidth={3} aria-hidden="true" />
                    ) : estado === "activo" ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ia" aria-hidden="true" />
                    ) : (
                      <CircleDashed className="h-4 w-4 shrink-0 text-tenue" aria-hidden="true" />
                    )}
                    <span>
                      <span className="block font-bold">{p.nombre}</span>
                      <span className="block text-suave">{p.hace}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Tarjeta>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Email({ lead }: { lead: Lead }) {
  const actualizar = useCRM((s) => s.actualizarLead);
  const ejecutando = useCRM((s) => s.ejecutando[lead.id]);
  const [copiado, setCopiado] = useState(false);
  const b = lead.borrador;

  if (!b)
    return (
      <Tarjeta className="p-5">
        <h2 className="flex items-center gap-2 font-extrabold">
          <Mail className="h-4 w-4 text-tenue" aria-hidden="true" /> Primer email
        </h2>
        <p className="mt-2 text-sm text-suave">Todavía no hay borrador. Ejecuta los agentes y el redactor preparará uno para que lo revises.</p>
      </Tarjeta>
    );

  const editar = (campo: "asunto" | "cuerpo", valor: string) =>
    actualizar(lead.id, (l) => ({ borrador: l.borrador ? { ...l.borrador, [campo]: valor, editado: true } : null }));

  const aprobar = () => aprobarEmail(lead.id);
  const descartar = () => descartarEmail(lead.id);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${b.asunto}\n\n${b.cuerpo}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {}
  };

  const pendiente = b.estado === "pendiente";

  return (
    <Tarjeta className={`p-5 ${pendiente ? "border-ia/40 ring-4 ring-ia/5" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-extrabold">
          <Mail className={`h-4 w-4 ${pendiente ? "text-ia" : "text-tenue"}`} aria-hidden="true" /> Primer email
        </h2>
        <OrigenTag origen={b.origen} />
        {b.editado && <span className="rounded-md bg-marca-clara px-1.5 py-0.5 text-[11px] font-bold text-marca-oscura">Editado</span>}
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${
            pendiente ? "bg-ia-clara text-ia" : b.estado === "aprobado" ? "bg-marca-clara text-marca-oscura" : "bg-hundido text-suave"
          }`}
        >
          {pendiente ? "Pendiente de tu aprobación" : b.estado === "aprobado" ? "Aprobado y enviado" : "Descartado"}
        </span>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-bold text-suave">Asunto</span>
        <input className={campo} value={b.asunto} onChange={(e) => editar("asunto", e.target.value)} disabled={!pendiente} />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 flex justify-between text-xs font-bold text-suave">
          Mensaje para {lead.contacto.nombre || "el contacto"} <span className="font-semibold text-tenue">{lead.contacto.email}</span>
        </span>
        <textarea
          className={`${campo} min-h-[220px] leading-relaxed`}
          value={b.cuerpo}
          onChange={(e) => editar("cuerpo", e.target.value)}
          disabled={!pendiente}
        />
      </label>
      {b.seguimiento && (
        <p className="mt-2 text-xs text-suave">
          <span className="font-bold">Seguimiento sugerido:</span> {b.seguimiento}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {pendiente && (
          <button onClick={aprobar} className={boton.marca}>
            <Send className="h-4 w-4" aria-hidden="true" /> Aprobar y marcar como enviado
          </button>
        )}
        <button onClick={() => reescribirEmail(lead.id)} disabled={!!ejecutando} className={boton.secundario}>
          {ejecutando === "redactor" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          {pendiente ? "Reescribir" : "Nuevo borrador"}
        </button>
        <button onClick={copiar} className={boton.fantasma}>
          {copiado ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />} {copiado ? "Copiado" : "Copiar"}
        </button>
        {pendiente && (
          <button onClick={descartar} className={`${boton.fantasma} sm:ml-auto`}>
            <X className="h-4 w-4" aria-hidden="true" /> Descartar
          </button>
        )}
      </div>
      <p className="mt-3 text-[11px] text-tenue">En esta demo no se envía ningún email: al aprobarlo queda registrado y el lead pasa a Contactado.</p>
    </Tarjeta>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-tenue">{titulo}</h3>
      <ul className="mt-1.5 space-y-1.5 text-sm">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-tenue" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FichaLead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lead = useCRM((s) => s.leads.find((l) => l.id === id));
  const ajustes = useCRM((s) => s.ajustes);
  const ejecutando = useCRM((s) => s.ejecutando[id]);
  const mover = useCRM((s) => s.moverEtapa);
  const actualizar = useCRM((s) => s.actualizarLead);
  const anadirEvento = useCRM((s) => s.anadirEvento);
  const eliminar = useCRM((s) => s.eliminarLead);
  const asignar = useCRM((s) => s.asignar);
  const usuarios = useCRM((s) => s.usuarios);
  const yo = useUsuario();
  const [nota, setNota] = useState("");
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (lead) document.title = `${lead.empresa} · Rumbo`;
  }, [lead]);

  if (!lead || (yo.rol !== "admin" && lead.responsableId !== yo.id))
    return (
      <div className="py-20 text-center">
        <p className="font-bold">{lead ? "Este lead está asignado a otra persona del equipo." : "Este lead no existe o se ha eliminado."}</p>
        <Link href="/leads" className={`${boton.secundario} mt-4`}>
          Volver a leads
        </Link>
      </div>
    );

  const p = puntuar(lead, ajustes);
  const prob = probabilidadCierre(lead, ajustes);
  const mapa = lead.mapaEmpatia;
  const hoy = new Date().toISOString().slice(0, 10);
  const rec = lead.recomendacion;
  const inv = lead.investigacion;

  return (
    <div className="space-y-4">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-suave hover:text-tinta">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Leads
      </Link>

      {/* Cabecera */}
      <div className="flex flex-wrap items-start gap-4">
        <Iniciales nombre={lead.empresa} className="h-12 w-12 text-base" />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-tight">
            {lead.empresa}
            {lead.origenLead === "prospector" && <span className="rounded-md bg-ia-clara px-1.5 py-0.5 text-xs font-bold text-ia">Cuenta ficticia del prospector</span>}
            {lead.origenLead === "importado" && <span className="rounded-md bg-hundido px-1.5 py-0.5 text-xs font-bold text-suave">Importado</span>}
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-suave">
            <span>{lead.sector}</span>·<span>{lead.tamano} empleados</span>
            {lead.ciudad && (
              <>
                ·<span>{lead.ciudad}</span>
              </>
            )}
            {lead.web && (
              <>
                ·
                <a href={lead.web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-marca hover:underline">
                  {lead.web.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="etapa">
            Etapa
          </label>
          <select id="etapa" className={`${campoBase} font-bold`} value={lead.etapa} onChange={(e) => mover(lead.id, e.target.value as Etapa)}>
            {ETAPAS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
          <button onClick={() => ejecutarAgentes(lead.id)} disabled={!!ejecutando} className={boton.ia}>
            {ejecutando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            {ejecutando ? "Trabajando…" : inv ? "Volver a preparar" : "Preparar con agentes"}
          </button>
        </div>
      </div>

      <Ejecucion lead={lead} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="space-y-4">
          <Email lead={lead} />

          <Tarjeta className="p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold">Ficha de cuenta</h2>
              {inv && <OrigenTag origen={inv.origen} />}
            </div>
            {inv ? (
              <div className="mt-3 space-y-4">
                <p className="text-sm leading-relaxed">{inv.resumen}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Lista titulo="Señales del sector" items={inv.senales} />
                  <Lista titulo="Problemas probables" items={inv.dolores} />
                </div>
                <div className="rounded-xl bg-hundido/70 p-3">
                  <Lista titulo="Preguntas para la primera llamada" items={inv.preguntas} />
                </div>
                <p className="text-[11px] text-tenue">Son hipótesis a partir de los datos del lead y del sector. Valídalas antes de usarlas.</p>
              </div>
            ) : ejecutando ? (
              <div className="mt-3 space-y-2">
                <div className="cargando h-4 w-11/12 rounded" />
                <div className="cargando h-4 w-9/12 rounded" />
                <div className="cargando h-4 w-10/12 rounded" />
              </div>
            ) : (
              <p className="mt-2 text-sm text-suave">El investigador preparará un resumen, las señales del sector, los problemas probables y preguntas para la primera llamada.</p>
            )}
          </Tarjeta>

          <Tarjeta className="p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold">Mapa de empatía {lead.contacto.nombre ? `de ${lead.contacto.nombre.split(" ")[0]}` : "del contacto"}</h2>
              {mapa && <OrigenTag origen={mapa.origen} />}
            </div>
            {mapa ? (
              <>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["Piensa y siente", mapa.piensa],
                      ["Ve", mapa.ve],
                      ["Oye", mapa.oye],
                      ["Dice y hace", mapa.dice],
                      ["Esfuerzos y miedos", mapa.esfuerzos],
                      ["Resultados que espera", mapa.resultados],
                    ] as const
                  ).map(([t, v]) => (
                    <div key={t} className="rounded-xl border border-linea p-3">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-tenue">{t}</dt>
                      <dd className="mt-1 text-sm leading-relaxed">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-[11px] text-tenue">Hipótesis para preparar la conversación, no datos de la persona.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-suave">El investigador lo preparará junto con la ficha de cuenta.</p>
            )}
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="font-extrabold">Historial</h2>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!nota.trim()) return;
                anadirEvento(lead.id, { tipo: "nota", texto: nota.trim(), autor: "humano" });
                setNota("");
              }}
            >
              <label htmlFor="nota" className="sr-only">
                Añadir nota
              </label>
              <input id="nota" className={campo} placeholder="Añade una nota: llamada, respuesta, objeción…" value={nota} onChange={(e) => setNota(e.target.value)} />
              <button className={boton.secundario} disabled={!nota.trim()} aria-label="Guardar nota">
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            </form>
            <ol className="mt-4 space-y-3 border-l border-linea pl-4">
              {[...lead.eventos].reverse().map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span
                    className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-superficie ${
                      e.autor === "humano" ? "bg-marca" : "bg-ia"
                    }`}
                    aria-hidden="true"
                  />
                  <p>{e.texto}</p>
                  <p className="text-xs text-tenue">
                    {fechaCorta(e.fecha)} · {e.autor === "humano" ? "Tú" : `Agente ${e.autor}`}
                  </p>
                </li>
              ))}
            </ol>
          </Tarjeta>
        </div>

        <div className="space-y-4">
          <Tarjeta className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-extrabold">Probabilidad de cierre</h2>
              <span className="cifras text-3xl font-extrabold tracking-tight text-marca-oscura">{prob.valor} %</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-hundido">
              <div className="h-full rounded-full bg-marca" style={{ width: `${prob.valor}%` }} />
            </div>
            <ul className="mt-3 space-y-1 text-xs">
              {prob.factores.map((f) => (
                <li key={f.etiqueta} className="flex justify-between gap-3">
                  <span className="text-suave">{f.etiqueta}</span>
                  <span className={`cifras font-bold ${f.efecto < 0 ? "text-rojo" : ""}`}>
                    {f.efecto > 0 && prob.factores[0] !== f ? "+" : ""}
                    {f.efecto}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-suave">
              Previsión ponderada: <span className="cifras font-bold text-tinta">{euros((lead.valor * prob.valor) / 100)}</span>
            </p>
          </Tarjeta>

          <Tarjeta className="p-5">
            <div className="flex items-center gap-4">
              <PuntuacionAnillo p={p} tamano={64} />
              <div>
                <h2 className="font-extrabold">Encaje con tu cliente ideal</h2>
                <div className="mt-1 flex items-center gap-2">
                  <NivelBadge p={p} />
                  <Link href="/ajustes" className="text-xs font-bold text-marca hover:underline">
                    Ajustar perfil
                  </Link>
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {p.factores.map((f) => (
                <li key={f.etiqueta}>
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="font-semibold">{f.etiqueta}</span>
                    <span className="cifras shrink-0 font-bold text-suave">
                      +{f.puntos}/{f.max}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hundido">
                    <div className="h-full rounded-full bg-marca" style={{ width: `${(f.puntos / f.max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-tenue">Puntuación con reglas transparentes: cada punto tiene un motivo.</p>
          </Tarjeta>

          <Tarjeta className="p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold">Producto recomendado</h2>
              {rec && <OrigenTag origen={rec.origen} />}
            </div>
            {rec ? (
              <>
                <p className="mt-3 text-lg font-extrabold text-marca-oscura">{producto(rec.productoId)?.nombre}</p>
                <p className="mt-1 text-sm leading-relaxed text-suave">{rec.motivo}</p>
                <ul className="mt-4 space-y-2">
                  {PRODUCTOS.map((pr) => (
                    <li key={pr.id}>
                      <div className="flex justify-between text-xs">
                        <span className={pr.id === rec.productoId ? "font-extrabold" : "font-semibold text-suave"}>{pr.nombre}</span>
                        <span className="cifras font-bold text-suave">{rec.afinidad[pr.id] ?? 0} %</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hundido">
                        <div
                          className={`h-full rounded-full ${pr.id === rec.productoId ? "bg-marca" : "bg-tenue/50"}`}
                          style={{ width: `${rec.afinidad[pr.id] ?? 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-suave">El recomendador comparará el lead con los cuatro productos del catálogo.</p>
            )}
          </Tarjeta>

          <Tarjeta className="p-5">
            <h2 className="font-extrabold">Contacto y contexto</h2>
            <div className="mt-3 flex items-center gap-3">
              <Iniciales nombre={lead.contacto.nombre} className="h-10 w-10 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-bold">{lead.contacto.nombre || "Contacto por identificar"}</p>
                <p className="truncate text-xs text-suave">{lead.contacto.cargo}</p>
                {lead.contacto.email && <p className="truncate text-xs text-marca">{lead.contacto.email}</p>}
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold text-tenue">Lo que necesita</dt>
                <dd className="mt-0.5">{lead.necesidad || <span className="text-tenue">Sin indicar</span>}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-tenue">Valor estimado</dt>
                <dd className="cifras mt-0.5 font-bold">{euros(lead.valor)} al año</dd>
              </div>
              <div>
                <label htmlFor="dolencia" className="text-xs font-bold text-tenue">
                  Problema principal
                </label>
                <select id="dolencia" className={`${campo} mt-1`} value={lead.dolencia} onChange={(e) => actualizar(lead.id, { dolencia: e.target.value })}>
                  {DOLENCIAS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="siguiente" className="text-xs font-bold text-tenue">
                  Siguiente paso
                </label>
                <input id="siguiente" className={`${campo} mt-1`} value={lead.siguientePaso} onChange={(e) => actualizar(lead.id, { siguientePaso: e.target.value })} />
                <div className="mt-2 flex items-center gap-2">
                  <label htmlFor="fecha" className="sr-only">
                    Fecha del siguiente paso
                  </label>
                  <input
                    id="fecha"
                    type="date"
                    className={`${campoBase} flex-1`}
                    value={lead.siguienteFecha ?? ""}
                    onChange={(e) => actualizar(lead.id, { siguienteFecha: e.target.value || null })}
                  />
                  {lead.siguienteFecha && lead.siguienteFecha < hoy && <span className="text-xs font-bold text-rojo">Vencido</span>}
                </div>
              </div>
              <div>
                <label htmlFor="responsable" className="text-xs font-bold text-tenue">
                  Responsable
                </label>
                <select
                  id="responsable"
                  className={`${campo} mt-1`}
                  value={lead.responsableId}
                  onChange={(e) => asignar(lead.id, e.target.value)}
                  disabled={yo.rol !== "admin"}
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
                {yo.rol !== "admin" && <p className="mt-1 text-[11px] text-tenue">Solo la dirección comercial puede reasignar.</p>}
              </div>
              {lead.notas && (
                <div>
                  <dt className="text-xs font-bold text-tenue">Notas para contactar</dt>
                  <dd className="mt-0.5">{lead.notas}</dd>
                </div>
              )}
            </dl>
          </Tarjeta>

          <div className="text-right">
            {confirmarBorrar ? (
              <span className="text-sm">
                ¿Eliminar este lead?{" "}
                <button
                  className="font-bold text-rojo underline underline-offset-4"
                  onClick={() => {
                    eliminar(lead.id);
                    router.push("/leads");
                  }}
                >
                  Sí, eliminar
                </button>{" "}
                ·{" "}
                <button className="font-bold underline underline-offset-4" onClick={() => setConfirmarBorrar(false)}>
                  Cancelar
                </button>
              </span>
            ) : (
              <button onClick={() => setConfirmarBorrar(true)} className={boton.fantasma}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar lead
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
