"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Download, FileUp, Info, X } from "lucide-react";
import { DOLENCIAS } from "../lib/catalogo";
import { useCRM, type DatosLead } from "../lib/store";
import type { Tamano } from "../lib/tipos";
import { boton, campoBase, useEscape } from "./ui";

// Importación de leads desde CSV (exportado de Excel, Google Sheets u otro CRM), con mapeo de columnas y validación.

const CAMPOS = [
  { id: "empresa", nombre: "Empresa", obligatorio: true, sinonimos: ["empresa", "nombre empresa", "compania", "company", "cuenta"] },
  { id: "contacto", nombre: "Contacto", obligatorio: true, sinonimos: ["contacto", "nombre", "persona", "contact", "full name"] },
  { id: "cargo", nombre: "Cargo", sinonimos: ["cargo", "puesto", "position", "title"] },
  { id: "email", nombre: "Email", sinonimos: ["email", "correo", "e-mail", "mail"] },
  { id: "web", nombre: "Web", sinonimos: ["web", "website", "sitio", "url"] },
  { id: "sector", nombre: "Sector", sinonimos: ["sector", "industria", "industry", "segmento"] },
  { id: "tamano", nombre: "Tamaño", sinonimos: ["tamano", "tamaño", "empleados", "size", "plantilla"] },
  { id: "ciudad", nombre: "Ciudad", sinonimos: ["ciudad", "localidad", "city", "provincia"] },
  { id: "necesidad", nombre: "Necesidad", sinonimos: ["necesidad", "dolencia", "problema", "pain", "necesita"] },
  { id: "notas", nombre: "Notas", sinonimos: ["notas", "comentarios", "notes", "notas para contactar"] },
  { id: "valor", nombre: "Valor (€)", sinonimos: ["valor", "importe", "revenue", "valor estimado", "presupuesto"] },
] as const;

type IdCampo = (typeof CAMPOS)[number]["id"];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

function parsearCSV(texto: string): string[][] {
  const primera = texto.split(/\r?\n/)[0] ?? "";
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda);
      if (fila.some((x) => x.trim())) filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  fila.push(celda);
  if (fila.some((x) => x.trim())) filas.push(fila);
  return filas;
}

function aTamano(v: string): Tamano {
  const t = norm(v);
  if (["1-49", "50-249", "250-999", "1000+"].includes(t)) return t as Tamano;
  const n = parseInt(t.replace(/\D/g, ""), 10);
  if (!isNaN(n)) return n < 50 ? "1-49" : n < 250 ? "50-249" : n < 1000 ? "250-999" : "1000+";
  if (t.includes("grande")) return "1000+";
  if (t.includes("startup") || t.includes("micro")) return "1-49";
  return "50-249";
}

const PLANTILLA = `empresa;contacto;cargo;email;web;sector;tamano;ciudad;necesidad;valor
Panaderías Ejemplo;Ana Prueba;Gerente;ana.prueba@panaderias.example;https://panaderias.example;Retail;80;Toledo;Fichamos en papel en ocho tiendas;7000
Hoteles Demo;Luis Ficticio;Director de RR. HH.;luis.ficticio@hoteles.example;https://hoteles.example;Hostelería;300;Cádiz;Cuadrantes de verano en Excel;24000
`;

export default function ImportarCSV({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const crearLeads = useCRM((s) => s.crearLeads);
  const [filas, setFilas] = useState<string[][]>([]);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [mapa, setMapa] = useState<Record<IdCampo, number>>({} as Record<IdCampo, number>);
  const [hecho, setHecho] = useState<number | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const cabecera = filas[0] ?? [];
  const datos = filas.slice(1, 201);

  const leer = (archivo: File) => {
    setError("");
    setHecho(null);
    if (archivo.size > 2_000_000) return setError("El archivo es demasiado grande para la demo (máximo 2 MB).");
    const lector = new FileReader();
    lector.onload = () => {
      const f = parsearCSV(String(lector.result ?? ""));
      if (f.length < 2) return setError("No hay filas que importar.");
      setFilas(f);
      setNombreArchivo(archivo.name);
      const auto = {} as Record<IdCampo, number>;
      for (const c of CAMPOS) {
        const i = f[0].findIndex((h) => (c.sinonimos as readonly string[]).includes(norm(h)));
        auto[c.id] = i;
      }
      setMapa(auto);
    };
    lector.readAsText(archivo, "utf-8");
  };

  const validados = useMemo(() => {
    const v = (fila: string[], id: IdCampo) => (mapa[id] >= 0 ? (fila[mapa[id]] ?? "").trim() : "");
    return datos.map((fila) => {
      const errores: string[] = [];
      const empresa = v(fila, "empresa");
      const contacto = v(fila, "contacto");
      const email = v(fila, "email");
      if (!empresa) errores.push("sin empresa");
      if (!contacto) errores.push("sin contacto");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push("email no válido");
      const lead: DatosLead = {
        empresa,
        web: v(fila, "web"),
        sector: v(fila, "sector") || "Otro",
        tamano: aTamano(v(fila, "tamano")),
        ciudad: v(fila, "ciudad"),
        contacto: { nombre: contacto, cargo: v(fila, "cargo"), email },
        necesidad: v(fila, "necesidad"),
        dolencia: DOLENCIAS[DOLENCIAS.length - 1],
        notas: v(fila, "notas"),
        valor: Math.max(0, Number(v(fila, "valor").replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".")) || 0),
        origenLead: "importado",
      };
      return { lead, errores };
    });
  }, [datos, mapa]);

  const validas = validados.filter((x) => !x.errores.length);
  const faltaObligatorio = CAMPOS.some((c) => "obligatorio" in c && c.obligatorio && !(mapa[c.id] >= 0));

  const importar = () => {
    crearLeads(validas.map((x) => x.lead));
    setHecho(validas.length);
    setFilas([]);
  };

  const cerrar = () => {
    setFilas([]);
    setHecho(null);
    setError("");
    onCerrar();
  };

  const descargarPlantilla = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + PLANTILLA], { type: "text/csv;charset=utf-8" }));
    a.download = "plantilla-leads.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  useEscape(abierto, cerrar);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px]" onClick={cerrar} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-importar"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-t-3xl bg-superficie shadow-elevada sm:rounded-3xl"
          >
            <div className="desplazable max-h-[92dvh] overflow-y-auto p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="titulo-importar" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                  <FileUp className="h-5 w-5 text-marca" aria-hidden="true" /> Importar leads desde CSV
                </h2>
                <p className="mt-1 text-sm text-suave">Exporta tu Excel u otro CRM a CSV. Detectamos las columnas y puedes corregir el mapeo.</p>
              </div>
              <button type="button" onClick={cerrar} className={boton.fantasma} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 flex gap-2 rounded-xl bg-hundido/70 p-3 text-xs leading-relaxed text-suave">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Importa solo datos que puedas tratar legalmente. Es una demo: los datos se quedan en tu navegador y no se envían a ningún servidor salvo cuando ejecutas un agente.
            </p>

            {hecho !== null ? (
              <div className="mt-5 rounded-xl bg-marca-clara p-4 text-sm font-bold text-marca-oscura" role="status">
                {hecho} leads importados en la etapa Nuevo. Prepáralos con los agentes desde el panel o desde cada ficha.
              </div>
            ) : filas.length === 0 ? (
              <div className="mt-5">
                <button
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) leer(f);
                  }}
                  className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-linea p-10 text-sm text-suave transition hover:border-marca hover:bg-marca-clara/40"
                >
                  <FileUp className="h-8 w-8 text-tenue" aria-hidden="true" />
                  <span className="font-bold text-tinta">Arrastra un CSV o pulsa para elegirlo</span>
                  <span className="text-xs">Separado por comas o por punto y coma · hasta 200 filas</span>
                </button>
                <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && leer(e.target.files[0])} />
                <button onClick={descargarPlantilla} className={`${boton.fantasma} mt-3`}>
                  <Download className="h-4 w-4" aria-hidden="true" /> Descargar plantilla de ejemplo
                </button>
                {error && (
                  <p role="alert" className="mt-3 rounded-xl bg-rojo-claro px-3 py-2 text-sm font-semibold text-rojo">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <p className="text-sm">
                  <span className="font-bold">{nombreArchivo}</span> · {datos.length} filas
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {CAMPOS.map((c) => (
                    <label key={c.id} className="block">
                      <span className="mb-1 block text-xs font-bold text-suave">
                        {c.nombre}
                        {"obligatorio" in c && c.obligatorio ? " *" : ""}
                      </span>
                      <select className={`${campoBase} w-full`} value={mapa[c.id] ?? -1} onChange={(e) => setMapa({ ...mapa, [c.id]: Number(e.target.value) })}>
                        <option value={-1}>No importar</option>
                        {cabecera.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `Columna ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-xl border border-linea">
                  <table className="w-full min-w-[560px] text-xs">
                    <thead className="bg-hundido/60 text-left font-bold text-suave">
                      <tr>
                        <th className="px-3 py-2">Empresa</th>
                        <th className="px-3 py-2">Contacto</th>
                        <th className="px-3 py-2">Sector</th>
                        <th className="px-3 py-2">Tamaño</th>
                        <th className="px-3 py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-linea">
                      {validados.slice(0, 6).map(({ lead, errores }, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-semibold">{lead.empresa || "—"}</td>
                          <td className="px-3 py-2">{lead.contacto.nombre || "—"}</td>
                          <td className="px-3 py-2">{lead.sector}</td>
                          <td className="px-3 py-2">{lead.tamano}</td>
                          <td className="px-3 py-2">
                            {errores.length ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rojo">
                                <AlertTriangle className="h-3 w-3" aria-hidden="true" /> {errores.join(", ")}
                              </span>
                            ) : (
                              <span className="font-bold text-marca">Correcta</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-suave">
                  {validas.length} filas válidas de {validados.length}
                  {validados.length - validas.length > 0 && ` · ${validados.length - validas.length} se omitirán por errores`}
                </p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setFilas([])} className={boton.secundario}>
                    Elegir otro archivo
                  </button>
                  <button onClick={importar} disabled={faltaObligatorio || !validas.length} className={boton.marca}>
                    Importar {validas.length} leads
                  </button>
                </div>
              </div>
            )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
