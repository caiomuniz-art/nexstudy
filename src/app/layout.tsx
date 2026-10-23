import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NexStudy",
    template: "%s · NexStudy",
  },
  description: "Organize tarefas, provas, horários e estudos em um só lugar.",
};

const themeScript = `try{var t=localStorage.getItem("oe-theme");var d=t==="dark"||((t==="system"||!t)&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <div className="oe-backdrop" aria-hidden="true">
          <span className="oe-shape oe-shape-diamond" />
          <span className="oe-shape oe-shape-ring" />
          <span className="oe-shape oe-shape-block" />
        </div>
        <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
        {children}
      </body>
    </html>
  );
}
