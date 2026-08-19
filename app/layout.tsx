import type { Metadata, Viewport } from 'next';
import { Inter, Archivo_Black } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Quiniela Mundial 2026 · PADELBOX × DELISH',
    template: '%s · QuinielaBOX',
  },
  description:
    'La quiniela privada del Mundial 2026 para socios y amigos del club PADELBOX. Pronostica marcadores, gana premios semanales y pelea por el podio. Por QuinielaBOX.',
  applicationName: 'QuinielaBOX',
  keywords: [
    'quiniela mundial 2026',
    'quiniela futbol',
    'quiniela padelbox',
    'pronosticos mundial 2026',
    'quiniela privada club',
    'quinielabox',
  ],
  authors: [{ name: 'Solintlabs', url: 'https://solint.cloud' }],
  creator: 'Solintlabs',
  publisher: 'Solintlabs',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: siteUrl,
    siteName: 'QuinielaBOX',
    title: 'Quiniela Mundial 2026 · PADELBOX × DELISH',
    description:
      'La quiniela privada del Mundial 2026 para socios y amigos de PADELBOX. Premios semanales, ranking en vivo y app móvil iOS + Android.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'QuinielaBOX — Quiniela del Mundial 2026 PADELBOX × DELISH',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quiniela Mundial 2026 · PADELBOX × DELISH',
    description:
      'Pronostica los partidos del Mundial 2026, escala el ranking y gana premios cada semana. App iOS + Android.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  category: 'sports',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Apple Smart App Banner — Safari iOS muestra automaticamente un banner
  // nativo en la parte superior con "QuinielaBOX — View / Open" enlazando
  // al App Store. Sin coste, dismissable por el usuario, sin JS.
  // https://developer.apple.com/documentation/webkit/promoting_apps_with_smart_app_banners
  other: {
    'apple-itunes-app': 'app-id=6770234104',
    // Verificación de propiedad de AdSense (metaetiqueta oficial, en el
    // <head> de todas las páginas — el comprobador no siempre ve el script).
    ...(process.env.NEXT_PUBLIC_ADSENSE_CLIENT
      ? { 'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_CLIENT }
      : {}),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  colorScheme: 'dark light',
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'QuinielaBOX',
  alternateName: 'Quiniela PADELBOX',
  url: siteUrl,
  logo: `${siteUrl}/logos/completo-blanco.png`,
  sameAs: ['https://solint.cloud'],
  founder: { '@type': 'Organization', name: 'Solintlabs', url: 'https://solint.cloud' },
};

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'QuinielaBOX',
  url: siteUrl,
  inLanguage: 'es-ES',
  publisher: { '@type': 'Organization', name: 'QuinielaBOX' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES" suppressHydrationWarning className={`${inter.variable} ${archivoBlack.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </body>
    </html>
  );
}
