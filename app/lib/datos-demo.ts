import { AJUSTES_INICIALES, USUARIOS_DEMO } from "./catalogo";
import { investigarSinIA, mapaEmpatiaSinIA, recomendarSinIA, redactarSinIA, siguientePasoSugerido } from "./respaldo";
import type { Etapa, Lead, RegistroAgente, Tamano } from "./tipos";

// Datos de ejemplo. Empresas, personas y correos son inventados; los dominios .example
// están reservados y no pertenecen a nadie.

type Semilla = {
  e: string; // empresa
  s: string; // sector
  t: Tamano;
  c: string; // ciudad
  n: string; // contacto
  cargo: string;
  nec: string; // necesidad
  dol: string; // dolencia
  v: number; // valor
  et: Etapa;
  d: number; // días desde la creación
  r: string; // responsable
  cierre?: number; // días desde el cierre (ganado o perdido)
  sig?: number; // días hasta el siguiente paso (negativo = vencido)
};

const SEMILLAS: Semilla[] = [
  { e: "Hoteles Mareaviva", s: "Hostelería", t: "250-999", c: "Málaga", n: "Elena Quirós", cargo: "Directora de RR. HH.", nec: "Hacemos los cuadrantes de verano en Excel y cada cambio de turno es una cadena de WhatsApps", dol: "Cuadrantes y turnos manuales", v: 38000, et: "propuesta", d: 21, r: "u1", sig: 1 },
  { e: "Transportes Cierzo", s: "Logística", t: "250-999", c: "Zaragoza", n: "Íñigo Lasarte", cargo: "Jefe de operaciones", nec: "Turnos de noche rotativos y muchas horas extra que no cuadran con las nóminas", dol: "Horas extra sin control", v: 42000, et: "cualificado", d: 16, r: "u2", sig: 0 },
  { e: "Panaderías La Espiga Dorada", s: "Retail", t: "50-249", c: "Valladolid", n: "Marta Ugarte", cargo: "Gerente", nec: "Fichamos en papel en 23 obradores y tiendas", dol: "Registro de jornada en papel o Excel", v: 9500, et: "contactado", d: 9, r: "u1", sig: -2 },
  { e: "Clínicas Alameda Salud", s: "Salud privada", t: "250-999", c: "Sevilla", n: "Rafael Montoya", cargo: "Director de operaciones", nec: "Coordinar guardias y descansos entre cuatro centros", dol: "Coberturas de última hora", v: 31000, et: "cualificado", d: 13, r: "u1", sig: 3 },
  { e: "Moda Brezo", s: "Retail", t: "1000+", c: "A Coruña", n: "Paula Seoane", cargo: "Head of People", nec: "Alta rotación en tienda y formación de nuevas incorporaciones cada temporada", dol: "Formación y onboarding lentos", v: 64000, et: "propuesta", d: 27, r: "u2", sig: 2 },
  { e: "Almacenes Duero Norte", s: "Logística", t: "50-249", c: "Burgos", n: "Andrés Peña", cargo: "Responsable de almacén", nec: "Picos de campaña en noviembre y personal de ETT que cambia cada semana", dol: "Cuadrantes y turnos manuales", v: 12500, et: "nuevo", d: 1, r: "u1" },
  { e: "Restaurantes Olivar del Sur", s: "Hostelería", t: "50-249", c: "Córdoba", n: "Lucía Barranco", cargo: "Gerente", nec: "Necesitamos controlar horas extra y registro de jornada en seis locales", dol: "Registro de jornada en papel o Excel", v: 11000, et: "nuevo", d: 2, r: "u1" },
  { e: "Grupo Ferretero Atalaya", s: "Retail", t: "250-999", c: "Murcia", n: "Javier Rocamora", cargo: "Director de RR. HH.", nec: "Absentismo alto y no tenemos datos por tienda", dol: "Absentismo sin datos", v: 27000, et: "contactado", d: 6, r: "u2", sig: 1 },
  { e: "Residencias Vientoclaro", s: "Salud privada", t: "250-999", c: "Valencia", n: "Carmen Igual", cargo: "Directora general", nec: "Turnos 24/7 y cobertura de bajas de última hora", dol: "Coberturas de última hora", v: 35000, et: "ganado", d: 40, r: "u1", cierre: 12 },
  { e: "Talleres Mecánicos Rodeno", s: "Industria", t: "50-249", c: "Teruel", n: "Sergio Blasco", cargo: "Jefe de taller", nec: "Control horario y formación en prevención", dol: "Registro de jornada en papel o Excel", v: 8000, et: "perdido", d: 34, r: "u2", cierre: 10 },
  { e: "Consultora Prisma Norte", s: "Servicios profesionales", t: "50-249", c: "Bilbao", n: "Ane Etxeberria", cargo: "Office manager", nec: "Imputar horas a proyectos", dol: "Otra", v: 6500, et: "nuevo", d: 3, r: "u2" },
  { e: "Supermercados Las Cañadas", s: "Retail", t: "1000+", c: "Albacete", n: "Francisco Ortín", cargo: "COO", nec: "Planificar personal según afluencia en 60 tiendas", dol: "Cuadrantes y turnos manuales", v: 88000, et: "cualificado", d: 11, r: "u2", sig: -1 },
  { e: "Hostales Camino Verde", s: "Hostelería", t: "1-49", c: "Logroño", n: "Irene Sáenz", cargo: "Propietaria", nec: "Somos pocos y nos organizamos bien, pero queremos fichaje legal", dol: "Registro de jornada en papel o Excel", v: 1800, et: "contactado", d: 8, r: "u1", sig: 5 },
  { e: "Logística Puerto Seco", s: "Logística", t: "1000+", c: "Madrid", n: "Daniel Arroyo", cargo: "Director de RR. HH.", nec: "Onboarding de 300 personas por campaña y rotación muy alta", dol: "Rotación alta de personal", v: 72000, et: "nuevo", d: 0, r: "u1" },
  { e: "Colegios Fuente Clara", s: "Educación", t: "250-999", c: "Granada", n: "Rocío Linares", cargo: "Directora de administración", nec: "Gestionar sustituciones del personal docente", dol: "Coberturas de última hora", v: 15000, et: "contactado", d: 12, r: "u2", sig: -4 },
  { e: "Ópticas Mirador", s: "Retail", t: "50-249", c: "Santander", n: "Hugo Cobo", cargo: "Responsable de tiendas", nec: "Cuadrantes de 18 tiendas con horarios comerciales distintos", dol: "Cuadrantes y turnos manuales", v: 14500, et: "propuesta", d: 18, r: "u1", sig: 2 },
  { e: "Lavanderías Nube Blanca", s: "Industria", t: "50-249", c: "Toledo", n: "Nuria Gil", cargo: "Jefa de producción", nec: "", dol: "Otra", v: 7000, et: "nuevo", d: 4, r: "u2" },
  { e: "Hospital de Día San Lorenzo", s: "Salud privada", t: "50-249", c: "Salamanca", n: "Tomás Bernal", cargo: "Coordinador de enfermería", nec: "Descansos obligatorios y cambios de turno entre enfermeras", dol: "Coberturas de última hora", v: 13000, et: "ganado", d: 52, r: "u2", cierre: 25 },
  // Histórico de los últimos meses (para la analítica)
  { e: "Cafeterías Brújula", s: "Hostelería", t: "50-249", c: "Pamplona", n: "Ainhoa Goñi", cargo: "Gerente", nec: "Cuadrantes de 9 locales y fines de semana", dol: "Cuadrantes y turnos manuales", v: 9800, et: "ganado", d: 160, r: "u1", cierre: 131 },
  { e: "Farmacias Laurel", s: "Retail", t: "50-249", c: "Cáceres", n: "Pedro Mora", cargo: "Director de operaciones", nec: "Guardias nocturnas y fichaje en 14 farmacias", dol: "Registro de jornada en papel o Excel", v: 12000, et: "ganado", d: 140, r: "u2", cierre: 104 },
  { e: "Mensajería Rayo Azul", s: "Logística", t: "250-999", c: "Getafe", n: "Sonia Prieto", cargo: "Directora de RR. HH.", nec: "Rotación del 40 % y formación de repartidores", dol: "Rotación alta de personal", v: 33000, et: "ganado", d: 120, r: "u1", cierre: 78 },
  { e: "Hipermercados Solana", s: "Retail", t: "1000+", c: "Jaén", n: "Raúl Medina", cargo: "Director general", nec: "Absentismo por centro y coste de horas extra", dol: "Absentismo sin datos", v: 54000, et: "perdido", d: 130, r: "u2", cierre: 95 },
  { e: "Clínica Dental Arce", s: "Salud privada", t: "1-49", c: "Huesca", n: "Laura Esteban", cargo: "Propietaria", nec: "Fichaje para seis personas", dol: "Registro de jornada en papel o Excel", v: 900, et: "perdido", d: 100, r: "u1", cierre: 88 },
  { e: "Conservas Ría Alta", s: "Industria", t: "250-999", c: "Vigo", n: "Xoán Lema", cargo: "Jefe de producción", nec: "Turnos de campaña y formación en seguridad alimentaria", dol: "Formación y onboarding lentos", v: 26000, et: "ganado", d: 95, r: "u2", cierre: 52 },
  { e: "Gimnasios Pulso", s: "Servicios profesionales", t: "50-249", c: "Castellón", n: "Nerea Climent", cargo: "Directora de operaciones", nec: "Monitores a turnos en ocho centros", dol: "Cuadrantes y turnos manuales", v: 10500, et: "ganado", d: 70, r: "u1", cierre: 38 },
  { e: "Distribuciones Altozano", s: "Logística", t: "50-249", c: "Lleida", n: "Jordi Pons", cargo: "Responsable de almacén", nec: "Horas extra en campaña", dol: "Horas extra sin control", v: 8700, et: "perdido", d: 80, r: "u2", cierre: 47 },
  { e: "Academias Trazo", s: "Educación", t: "50-249", c: "Murcia", n: "Inés Lorca", cargo: "Gerente", nec: "Sustituciones de profesores y horarios", dol: "Coberturas de última hora", v: 7200, et: "ganado", d: 60, r: "u2", cierre: 20 },
  { e: "Hoteles Faro Sur", s: "Hostelería", t: "250-999", c: "Cádiz", n: "Manuel Pastor", cargo: "Director de RR. HH.", nec: "Contratación de temporada y onboarding exprés", dol: "Formación y onboarding lentos", v: 29000, et: "perdido", d: 55, r: "u1", cierre: 18 },
];

const limpio = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");

const fecha = (diasAtras: number, horas = 10) => {
  const f = new Date();
  f.setDate(f.getDate() - diasAtras);
  f.setHours(horas, (Math.abs(diasAtras) * 17) % 60, 0, 0);
  return f.toISOString();
};

const dia = (desdeHoy: number) => {
  const f = new Date();
  f.setDate(f.getDate() + desdeHoy);
  return f.toISOString().slice(0, 10);
};

export function leadsDemo(): { leads: Lead[]; registro: RegistroAgente[] } {
  const registro: RegistroAgente[] = [];
  const leads = SEMILLAS.map((x, i) => {
    const id = `L${1001 + i}`;
    const dominio = `${limpio(x.e).slice(0, 18)}.example`;
    const [nombre, apellido] = x.n.split(" ");
    const cerrado = x.cierre !== undefined ? fecha(x.cierre, 17) : null;
    const lead: Lead = {
      id,
      empresa: x.e,
      web: `https://${dominio}`,
      sector: x.s,
      tamano: x.t,
      ciudad: x.c,
      contacto: { nombre: x.n, cargo: x.cargo, email: `${limpio(nombre)}.${limpio(apellido ?? "")}@${dominio}` },
      necesidad: x.nec,
      dolencia: x.dol,
      notas: "",
      valor: x.v,
      etapa: x.et,
      responsableId: x.r,
      origenLead: "demo",
      creado: fecha(x.d),
      actualizado: cerrado ?? fecha(Math.max(0, Math.min(x.d, 3) - 1), 16),
      cerrado,
      siguienteFecha: x.sig !== undefined ? dia(x.sig) : null,
      investigacion: null,
      mapaEmpatia: null,
      recomendacion: null,
      borrador: null,
      siguientePaso: "",
      eventos: [{ id: `${id}-e0`, fecha: fecha(x.d), tipo: "creado", texto: "Lead creado", autor: "humano" }],
    };
    // Los leads que ya avanzaron llegan con el trabajo de los agentes hecho (en modo sin IA)
    if (x.et !== "nuevo" || i % 2 === 0) {
      const preparado = fecha(x.d, 11);
      lead.investigacion = { ...investigarSinIA(lead), fecha: preparado };
      lead.mapaEmpatia = { ...mapaEmpatiaSinIA(lead), fecha: preparado };
      lead.recomendacion = { ...recomendarSinIA(lead), fecha: preparado };
      const borrador = redactarSinIA(lead, AJUSTES_INICIALES);
      lead.borrador = { ...borrador, estado: x.et === "nuevo" ? "pendiente" : "aprobado", editado: false, fecha: preparado };
      if (x.d < 60) {
        for (const [agente, accion] of [
          ["investigador", "Ficha de cuenta y mapa de empatía"],
          ["recomendador", "Recomendación de producto"],
          ["redactor", "Borrador de primer contacto"],
        ] as const) {
          registro.push({ id: `${id}-${agente}`, fecha: preparado, agente, leadId: id, empresa: x.e, accion, detalle: "Datos de ejemplo", modo: "reglas", duracionMs: 4 });
        }
      }
      if (x.et !== "nuevo") {
        lead.eventos.push({ id: `${id}-e1`, fecha: fecha(Math.max(0, x.d - 1), 12), tipo: "email", texto: "Primer email aprobado y enviado", autor: "humano" });
      }
      if (cerrado) {
        lead.eventos.push({ id: `${id}-e2`, fecha: cerrado, tipo: "etapa", texto: x.et === "ganado" ? "Propuesta → Ganado" : "Propuesta → Perdido", autor: "humano" });
      }
    }
    lead.siguientePaso = siguientePasoSugerido(lead);
    return lead;
  });
  registro.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return { leads, registro };
}

export const usuariosDemo = () => USUARIOS_DEMO.map((u) => ({ ...u }));
