export type Etapa = "nuevo" | "contactado" | "cualificado" | "propuesta" | "ganado" | "perdido";
export type Tamano = "1-49" | "50-249" | "250-999" | "1000+";
export type Origen = "ia" | "reglas";
export type Tono = "cercano" | "formal";
export type Agente = "investigador" | "analista" | "recomendador" | "redactor" | "prospector" | "humano";
export type Rol = "admin" | "comercial";
export type OrigenLead = "manual" | "prospector" | "importado" | "demo";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface MapaEmpatia {
  piensa: string;
  ve: string;
  oye: string;
  dice: string;
  esfuerzos: string;
  resultados: string;
  origen: Origen;
  fecha: string;
}

export interface Contacto {
  nombre: string;
  cargo: string;
  email: string;
}

export interface Investigacion {
  resumen: string;
  senales: string[];
  dolores: string[];
  preguntas: string[];
  origen: Origen;
  fecha: string;
}

export interface Recomendacion {
  productoId: string;
  afinidad: Record<string, number>; // 0-100 por producto
  motivo: string;
  origen: Origen;
  fecha: string;
}

export type EstadoBorrador = "pendiente" | "aprobado" | "descartado";

export interface Borrador {
  asunto: string;
  cuerpo: string;
  seguimiento: string;
  estado: EstadoBorrador;
  editado: boolean;
  origen: Origen;
  fecha: string;
}

export interface Evento {
  id: string;
  fecha: string;
  tipo: "creado" | "etapa" | "nota" | "email" | "agente";
  texto: string;
  autor: Agente;
}

export interface Lead {
  id: string;
  empresa: string;
  web: string;
  sector: string;
  tamano: Tamano;
  ciudad: string;
  contacto: Contacto;
  necesidad: string;
  dolencia: string; // categoría del problema principal
  notas: string; // notas para contactar
  valor: number; // € al año estimados
  etapa: Etapa;
  responsableId: string;
  origenLead: OrigenLead;
  creado: string;
  actualizado: string;
  cerrado: string | null; // fecha de ganado o perdido
  siguienteFecha: string | null; // AAAA-MM-DD
  investigacion: Investigacion | null;
  mapaEmpatia: MapaEmpatia | null;
  recomendacion: Recomendacion | null;
  borrador: Borrador | null;
  siguientePaso: string;
  eventos: Evento[];
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  paraQuien: string;
  palabrasClave: string[];
  precio: string;
}

export interface ConfigICP {
  sectores: string[];
  tamanos: Tamano[];
  cargosDecisores: string[];
}

export interface Ajustes {
  empresa: string;
  propuesta: string;
  firma: string;
  tono: Tono;
  icp: ConfigICP;
  ejecutarAlCrear: boolean;
}

export interface RegistroAgente {
  id: string;
  fecha: string;
  agente: Agente;
  leadId: string;
  empresa: string;
  accion: string;
  detalle: string;
  modo: Origen | "humano";
  duracionMs: number;
}

export interface Factor {
  etiqueta: string;
  puntos: number;
  max: number;
}

export interface Probabilidad {
  valor: number; // 0-100
  factores: { etiqueta: string; efecto: number }[];
}

export interface Puntuacion {
  total: number;
  nivel: "alta" | "media" | "baja";
  factores: Factor[];
}
