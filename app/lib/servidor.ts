import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Utilidades solo de servidor: cliente de Gemini, límite de uso y helpers de validación.

export const MODELO = "gemini-2.5-flash";
const apiKey = process.env.GEMINI_API_KEY;
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Límite orientativo por visitante (en memoria, se reinicia con cada instancia del servidor)
const VENTANA_MS = 10 * 60 * 1000;
const usos = new Map<string, number[]>();

export function permitirIA(req: Request, maximo: number, clave = "chat"): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const id = `${clave}:${ip}`;
  const ahora = Date.now();
  const recientes = (usos.get(id) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= maximo) {
    usos.set(id, recientes);
    return false;
  }
  recientes.push(ahora);
  usos.set(id, recientes);
  if (usos.size > 5000) usos.clear();
  return true;
}

export function texto(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

export function conTiempoMaximo<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms)),
  ]);
}

export function motivo(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
