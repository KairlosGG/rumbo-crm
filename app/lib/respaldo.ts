import { DOLENCIAS, PRODUCTOS, SECTORES, producto } from "./catalogo";
import { coincidenciasProducto } from "./puntuacion";
import type { Ajustes, Borrador, Investigacion, Lead, MapaEmpatia, Recomendacion } from "./tipos";

// Versiones sin IA de cada agente. Se usan cuando no hay clave, se agota la cuota o falla el modelo,
// y para preparar los datos de ejemplo. Son deterministas y no inventan hechos.

const SENALES: Record<string, string[]> = {
  Retail: ["Picos de afluencia en rebajas, festivos y campañas", "Plantillas repartidas entre varias tiendas", "Mucho personal a tiempo parcial"],
  Hostelería: ["Demanda muy estacional", "Turnos partidos y fines de semana", "Rotación alta en temporada"],
  Logística: ["Turnos de noche y rotativos", "Picos ligados a campañas de comercio electrónico", "Personal de ETT que cambia a menudo"],
  "Salud privada": ["Cobertura 24/7 con guardias", "Normativa estricta sobre descansos", "Varios centros o consultas"],
  Industria: ["Turnos rotativos en planta", "Control de horas extra", "Formación en seguridad obligatoria"],
  "Servicios profesionales": ["Trabajo híbrido o en remoto", "Imputación de horas a proyectos", "Crecimiento por incorporaciones"],
  Educación: ["Calendario escolar con picos", "Personal docente y no docente", "Sustituciones frecuentes"],
};

const PREGUNTAS = [
  "¿Cómo organizáis hoy los turnos y quién dedica tiempo a ello cada semana?",
  "¿Qué pasa cuando alguien falta a última hora?",
  "¿Cómo registráis la jornada y cómo respondéis si os la piden en una inspección?",
  "¿Qué indicador de personal os gustaría ver cada lunes y hoy no tenéis?",
];

export function investigarSinIA(lead: Lead): Investigacion {
  const senales = SENALES[lead.sector] ?? ["Plantilla operativa con necesidades de coordinación"];
  const coincide = coincidenciasProducto(`${lead.necesidad} ${lead.notas}`);
  const dolores = PRODUCTOS.filter((p) => coincide[p.id] > 0).map((p) => p.paraQuien);
  return {
    resumen: `${lead.empresa} es una empresa de ${lead.sector.toLowerCase()} de ${lead.tamano} empleados${lead.ciudad ? ` con sede en ${lead.ciudad}` : ""}. ${
      lead.necesidad ? `Ha comentado: «${lead.necesidad}».` : "Todavía no ha contado qué necesita."
    } Hay que validarlo en la primera conversación.`,
    senales,
    dolores: dolores.length ? dolores : ["Por confirmar en la primera llamada"],
    preguntas: PREGUNTAS.slice(0, 3),
    origen: "reglas",
    fecha: new Date().toISOString(),
  };
}

export function recomendarSinIA(lead: Lead): Recomendacion {
  const coincide = coincidenciasProducto(`${lead.necesidad} ${lead.notas}`);
  const base: Record<string, number> = { turnos: 30, fichaje: 30, academia: 20, insights: 15 };
  if (["Retail", "Hostelería", "Logística", "Salud privada", "Industria"].includes(lead.sector)) base.turnos += 15;
  if (lead.tamano === "250-999" || lead.tamano === "1000+") base.insights += 20;
  const afinidad = Object.fromEntries(PRODUCTOS.map((p) => [p.id, Math.min(95, base[p.id] + coincide[p.id] * 25)]));
  const productoId = Object.entries(afinidad).sort((a, b) => b[1] - a[1])[0][0];
  const p = producto(productoId)!;
  return {
    productoId,
    afinidad,
    motivo: `${p.nombre} es la opción con más encaje por el sector y por lo que ha contado el cliente. ${p.paraQuien}`,
    origen: "reglas",
    fecha: new Date().toISOString(),
  };
}

export function redactarSinIA(lead: Lead, ajustes: Ajustes): Omit<Borrador, "estado" | "editado"> {
  const p = producto(lead.recomendacion?.productoId ?? "turnos")!;
  const nombre = lead.contacto.nombre.split(" ")[0] || "";
  const saludo = !nombre ? (ajustes.tono === "formal" ? "Buenos días:" : "Hola:") : ajustes.tono === "formal" ? `Estimado/a ${lead.contacto.nombre}:` : `Hola, ${nombre}:`;
  const gancho = lead.necesidad
    ? `Me quedé con lo que comentabais: «${lead.necesidad}».`
    : `Trabajamos con varias empresas de ${lead.sector.toLowerCase()} con retos parecidos a los vuestros.`;
  return {
    asunto: `${lead.empresa}: una idea sobre ${p.nombre.replace("Brisa ", "").toLowerCase()}`,
    cuerpo: `${saludo}\n\n${gancho} En empresas de vuestro tamaño suele traducirse en horas de gestión que nadie ve y en errores difíciles de detectar.\n\n${p.nombre} ofrece ${p.descripcion.charAt(0).toLowerCase()}${p.descripcion.slice(1)}\n\n¿Te encaja una llamada de 20 minutos esta semana para ver si tiene sentido en ${lead.empresa}?\n\n${ajustes.firma}`,
    seguimiento: `Si no responde en 4 días: recordatorio breve con un caso de ${lead.sector.toLowerCase()} y una pregunta concreta.`,
    origen: "reglas",
    fecha: new Date().toISOString(),
  };
}

export function siguientePasoSugerido(lead: Lead): string {
  switch (lead.etapa) {
    case "nuevo":
      return "Revisar y aprobar el primer email";
    case "contactado":
      return "Hacer seguimiento si no responde en 4 días";
    case "cualificado":
      return "Agendar demo con el responsable de operaciones";
    case "propuesta":
      return "Resolver dudas de la propuesta y fijar fecha de decisión";
    case "ganado":
      return "Traspasar a implantación";
    default:
      return "Revisar dentro de 6 meses";
  }
}

export function mapaEmpatiaSinIA(lead: Lead): MapaEmpatia {
  const problema = lead.dolencia && lead.dolencia !== "Otra" ? lead.dolencia.toLowerCase() : "organizar al personal";
  return {
    piensa: `Que dedica demasiado tiempo a resolver «${problema}» en lugar de a ${lead.sector === "Salud privada" ? "la atención" : "hacer crecer el negocio"}.`,
    ve: `Compañeros de ${lead.sector.toLowerCase()} que ya gestionan su plantilla con herramientas digitales.`,
    oye: "Quejas del equipo por cambios de última hora y dudas sobre horas y descansos.",
    dice: lead.necesidad ? `«${lead.necesidad}»` : "Todavía no lo ha expresado: preguntar en la primera llamada.",
    esfuerzos: "Miedo a una implantación larga y a que la plantilla no adopte la herramienta.",
    resultados: "Menos horas de gestión, menos errores y tranquilidad ante una inspección.",
    origen: "reglas",
    fecha: new Date().toISOString(),
  };
}

// Prospector sin IA: combina piezas para crear cuentas ficticias según el sector que aparezca en la petición.
const NOMBRES = ["Alba", "Bruno", "Celia", "Darío", "Eva", "Fermín", "Gloria", "Héctor", "Iris", "Julián", "Lola", "Mateo"];
const APELLIDOS = ["Arnau", "Belmonte", "Cuesta", "Dorado", "Escudero", "Ferrán", "Galindo", "Hidalgo", "Ibarra", "Jover", "Lastra", "Marín"];
const PIEZAS: Record<string, [string[], string[]]> = {
  Retail: [["Tiendas", "Mercados", "Bazares", "Moda"], ["Cierva", "Almendro", "Mistral", "Encina", "Quimera"]],
  Hostelería: [["Hoteles", "Restaurantes", "Cafeterías", "Hostales"], ["Brisamar", "Candil", "Oliva Negra", "Albahaca", "Mirlo"]],
  Logística: [["Transportes", "Almacenes", "Distribuciones", "Logística"], ["Vereda", "Nordeste", "Cumbre", "Ribera", "Atlas Sur"]],
  "Salud privada": [["Clínicas", "Residencias", "Centros Médicos", "Fisioterapia"], ["Sauce", "Aurora", "Valle Claro", "Romero", "Lumbre"]],
  Industria: [["Talleres", "Conservas", "Industrias", "Envases"], ["Fragua", "Peñaroja", "Altamira Norte", "Cobalto", "Hierro Viejo"]],
  "Servicios profesionales": [["Gimnasios", "Consultoría", "Limpiezas", "Seguridad"], ["Pulsar", "Vértice", "Nítida", "Faro", "Alcor"]],
  Educación: [["Academias", "Colegios", "Escuelas Infantiles", "Formación"], ["Pupitre", "Lápiz Azul", "Arco Iris", "Brote", "Saber"]],
};
const CIUDADES = ["Murcia", "Alicante", "Valladolid", "Oviedo", "Granada", "Vitoria", "Badajoz", "Tarragona", "León", "Almería"];
const NECESIDADES = [
  "Cada semana rehacemos los cuadrantes a mano",
  "Seguimos fichando en papel y nos preocupa una inspección",
  "Las horas extra se nos van de las manos en temporada alta",
  "Incorporamos mucha gente y la formación inicial es un caos",
  "No sabemos qué centros tienen más absentismo",
];

export function prospectarSinIA(peticion: string, cantidad: number) {
  const p = peticion.toLowerCase();
  const sector = SECTORES.find((s) => p.includes(s.toLowerCase().slice(0, 5))) ?? "Retail";
  const [tipos, nombres] = PIEZAS[sector];
  const semilla = Date.now();
  return Array.from({ length: Math.min(6, Math.max(1, cantidad)) }, (_, i) => {
    const k = (semilla + i * 7) % 997;
    const empresa = `${tipos[k % tipos.length]} ${nombres[(k + i) % nombres.length]}`;
    const slug = empresa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "").slice(0, 18);
    const nombre = NOMBRES[(k + 3 * i) % NOMBRES.length];
    const apellido = APELLIDOS[(k + 5 * i) % APELLIDOS.length];
    const tamano = (["50-249", "250-999", "50-249", "1000+"] as const)[i % 4];
    const ni = (k + i) % NECESIDADES.length;
    return {
      empresa,
      web: `https://${slug}.example`,
      sector,
      tamano,
      ciudad: CIUDADES[(k + i) % CIUDADES.length],
      contacto: { nombre: `${nombre} ${apellido}`, cargo: i % 2 ? "Director de operaciones" : "Responsable de RR. HH.", email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@${slug}.example` },
      necesidad: NECESIDADES[ni],
      dolencia: DOLENCIAS[[0, 1, 2, 4, 6][ni]],
      notas: "Cuenta ficticia propuesta por el agente prospector",
      valor: { "50-249": 9000, "250-999": 26000, "1000+": 60000 }[tamano] + ((k * 37) % 5) * 1000,
    };
  });
}
