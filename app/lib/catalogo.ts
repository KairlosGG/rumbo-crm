import type { Ajustes, Etapa, Producto, Tamano } from "./tipos";

// Empresa ficticia que usa el CRM en esta demo: vende software de gestión de personal
// a empresas con plantillas operativas. Todo el contenido es inventado.

export const PRODUCTOS: Producto[] = [
  {
    id: "turnos",
    nombre: "Brisa Turnos",
    descripcion: "Planificación de turnos y cuadrantes con avisos al móvil y cambios entre compañeros.",
    paraQuien: "Equipos con turnos rotativos, picos de demanda o varios centros.",
    palabrasClave: ["turno", "cuadrante", "planific", "horario", "rotativ", "picos", "temporada", "cobertura", "cambios"],
    precio: "Desde 4 € por empleado y mes",
  },
  {
    id: "fichaje",
    nombre: "Brisa Fichaje",
    descripcion: "Registro de jornada desde móvil, tablet o terminal, con informes listos para inspección.",
    paraQuien: "Empresas que fichan en papel o en hojas de cálculo.",
    palabrasClave: ["fichaje", "fichar", "registro de jornada", "jornada", "horas extra", "inspección", "papel", "excel", "control horario"],
    precio: "Desde 2 € por empleado y mes",
  },
  {
    id: "academia",
    nombre: "Brisa Academia",
    descripcion: "Formación y bienvenida de nuevas incorporaciones en microlecciones desde el móvil.",
    paraQuien: "Empresas que incorporan mucha gente o con alta rotación.",
    palabrasClave: ["formación", "formar", "onboarding", "incorporac", "nuevos", "rotación", "curso", "aprendizaje"],
    precio: "Desde 3 € por empleado y mes",
  },
  {
    id: "insights",
    nombre: "Brisa Insights",
    descripcion: "Panel de absentismo, rotación y coste de personal por centro, con alertas.",
    paraQuien: "Direcciones de RR. HH. y operaciones que deciden con datos.",
    palabrasClave: ["absentismo", "bajas", "rotación", "datos", "informe", "coste", "indicadores", "kpi", "dirección"],
    precio: "Desde 600 € al mes",
  },
];

export const DOLENCIAS = [
  "Cuadrantes y turnos manuales",
  "Registro de jornada en papel o Excel",
  "Horas extra sin control",
  "Coberturas de última hora",
  "Formación y onboarding lentos",
  "Rotación alta de personal",
  "Absentismo sin datos",
  "Otra",
];

export const USUARIOS_DEMO = [
  { id: "u1", nombre: "Lucía Ferrer", email: "lucia.ferrer@brisa.example", rol: "comercial" as const },
  { id: "u2", nombre: "Diego Navas", email: "diego.navas@brisa.example", rol: "comercial" as const },
  { id: "u3", nombre: "Marta Soler", email: "marta.soler@brisa.example", rol: "admin" as const },
];

export const SECTORES = ["Retail", "Hostelería", "Logística", "Salud privada", "Industria", "Servicios profesionales", "Educación"];

export const TAMANOS: { id: Tamano; etiqueta: string }[] = [
  { id: "1-49", etiqueta: "1–49 empleados" },
  { id: "50-249", etiqueta: "50–249 empleados" },
  { id: "250-999", etiqueta: "250–999 empleados" },
  { id: "1000+", etiqueta: "1.000 o más" },
];

export const ETAPAS: { id: Etapa; nombre: string; probabilidad: number; color: string }[] = [
  { id: "nuevo", nombre: "Nuevo", probabilidad: 0.1, color: "#8a8f98" },
  { id: "contactado", nombre: "Contactado", probabilidad: 0.2, color: "#3b82c4" },
  { id: "cualificado", nombre: "Cualificado", probabilidad: 0.4, color: "#7a5cd6" },
  { id: "propuesta", nombre: "Propuesta", probabilidad: 0.6, color: "#d28a1e" },
  { id: "ganado", nombre: "Ganado", probabilidad: 1, color: "#1f8f5f" },
  { id: "perdido", nombre: "Perdido", probabilidad: 0, color: "#c2564b" },
];

export const etapaInfo = (id: Etapa) => ETAPAS.find((e) => e.id === id)!;
export const producto = (id: string) => PRODUCTOS.find((p) => p.id === id);

export const AJUSTES_INICIALES: Ajustes = {
  empresa: "Brisa Software",
  propuesta: "Software de gestión de personal para empresas con turnos: cuadrantes, fichaje, formación y datos de RR. HH.",
  firma: "Lucía Ferrer · Equipo comercial de Brisa Software",
  tono: "cercano",
  icp: {
    sectores: ["Retail", "Hostelería", "Logística", "Salud privada"],
    tamanos: ["50-249", "250-999"],
    cargosDecisores: ["director", "directora", "responsable", "gerente", "jefe", "jefa", "ceo", "coo", "head", "rrhh", "recursos humanos", "operaciones"],
  },
  ejecutarAlCrear: true,
};
