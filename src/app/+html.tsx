import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#6D4AFF" />
        <title>Omnia — One app. Every device.</title>
        <meta name="color-scheme" content="light dark" />
        <meta
          name="description"
          content="Omnia — one app, every device. A local-first toolkit with live in-app update alerts, built by Omprakash Suthar (@OPBSUTHAR)."
        />
        <meta property="og:title" content="Omnia — One app. Every device." />
        <meta
          property="og:description"
          content="A local-first toolkit for every screen you own. Focus timer, converter, scratchpad and live update alerts."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />

        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Omnia" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerBootstrap }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const globalStyles = `
  html, body { background: #F6F3ED; }
  @media (prefers-color-scheme: dark) {
    html, body { background: #08080C; }
  }
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior-y: none;
  }
  ::selection { background: rgba(109, 74, 255, 0.25); }
  #root { min-height: 100%; }
`;

const serviceWorkerBootstrap = `
  if ('serviceWorker' in navigator && !/Electron/i.test(navigator.userAgent)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .catch(function () {});
    });
  }
`;
