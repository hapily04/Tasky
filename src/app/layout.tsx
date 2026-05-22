import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "Tasky",
    template: "%s · Tasky",
  },
  description: "Goals you can finish — without the overwhelm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tasky-theme');var d=document.documentElement;if(t==='dark')d.classList.add('dark');else d.classList.remove('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${display.variable} ${body.variable} min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
