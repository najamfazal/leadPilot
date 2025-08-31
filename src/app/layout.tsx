import type { Metadata } from 'next';
import './globals.css';
import { ClientProvider } from './client-provider';

export const metadata: Metadata = {
  title: 'ScoreCard CRM',
  description: 'A smart Sales Pipeline Management App',
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body className="font-body antialiased h-full">
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
