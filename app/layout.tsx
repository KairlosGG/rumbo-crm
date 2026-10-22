import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rumbo-crm-omega.vercel.app"),
  title: { default: "Rumbo · CRM agéntico", template: "%s · Rumbo" },
  description:
    "CRM de prospección B2B con agentes de IA que investigan, puntúan, recomiendan y redactan, con aprobación humana y registro de cada acción.",
};

export const viewport: Viewport = { themeColor: "#f5f5f2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
