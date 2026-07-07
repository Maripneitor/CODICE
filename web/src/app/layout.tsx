import type { Metadata } from "next";
import "./globals.css";
import SessionSync from "@/components/SessionSync";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "Códice - Sistema de Control y Flujo de Almacén",
  description: "Catalogación, trazabilidad y gestión offline: control total de materiales y herramientas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionSync />
        <Toaster position="top-right" richColors closeButton theme="dark" />
        {children}
      </body>
    </html>
  );
}
