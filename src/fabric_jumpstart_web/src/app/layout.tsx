import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import RootProvider from '@components/Providers/rootProvider';
import '@styles/global.css';
import OGImage from '@images/logo.jpg';
import Header from '@components/Header';
import Footer from '@components/Footer';
import type { UhfData } from '@components/Footer';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import parse from 'html-react-parser';

let uhfData: UhfData = { cssIncludes: '', javascriptIncludes: '', footerHtml: '' };
try {
  uhfData = require('@data/uhf.json');
} catch {
  // UHF data not yet generated — will be empty on first run
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fabric Jumpstart',
  description: 'Extensive. Automated. Open-Source. Community Driven.',
  openGraph: {
    title: 'Fabric Jumpstart',
    description: 'Extensive. Automated. Open-Source. Community Driven.',
  },
  twitter: {
    card: 'summary',
    title: 'Fabric Jumpstart',
    description: 'Extensive. Automated. Open-Source. Community Driven.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const disableSeo = process.env.NEXT_PUBLIC_DISABLE_SEO === 'true';
  return (
    <html lang={locale}>
      <head>
        <meta property="og:image" content={OGImage.src} />
        <meta name="twitter:image" content={OGImage.src} />
        {disableSeo && <meta name="robots" content="noindex, nofollow" />}
        {uhfData.cssIncludes && parse(uhfData.cssIncludes)}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var bg=t==='light'?'#f2f2f2':'#0F0F0F';document.documentElement.style.backgroundColor=bg;document.documentElement.setAttribute('data-theme',t||'dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <RootProvider>
            <Header />
            <main style={{ minHeight: '100vh' }}>
              {children}
            </main>
            <Footer uhfData={uhfData} />
          </RootProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
