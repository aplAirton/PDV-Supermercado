import type React from "react"
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from "next"
import "./globals.css"
import "../styles/globals.css"
import "../styles/components.css"
import "../styles/caixa.css"
import "../styles/funcionarios.css"
import "../styles/produtos.css"
import "../styles/clientes.css"
import "../styles/configuracoes.css"
import "../styles/toasts.css"

export const metadata: Metadata = {
  title: "PDV Airton",
  description: "Sistema de PDV",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <style>
          {`
            * {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-action: manipulation;
              touch-action: manipulation;
              user-select: none;
            }
            body {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              touch-action: manipulation;
              -webkit-touch-action: manipulation;
            }
            html {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              touch-action: manipulation;
              -webkit-touch-action: manipulation;
            }
            input, textarea, select {
              -webkit-appearance: none;
              -webkit-text-size-adjust: 100%;
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
            }
            input:focus, textarea:focus, select:focus {
              font-size: 16px !important;
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
            }
          `}
        </style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Impedir zoom duplo toque
              let lastTouchEnd = 0;
              document.addEventListener('touchend', function(event) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                  event.preventDefault();
                }
                lastTouchEnd = now;
              }, false);

              // Impedir zoom por pinça
              document.addEventListener('touchmove', function(event) {
                if (event.touches.length > 1) {
                  event.preventDefault();
                }
              }, { passive: false });

              // Impedir zoom com Ctrl+scroll
              document.addEventListener('wheel', function(event) {
                if (event.ctrlKey) {
                  event.preventDefault();
                }
              }, { passive: false });

              // Impedir zoom com gesture events
              document.addEventListener('gesturestart', function(event) {
                event.preventDefault();
              });
              document.addEventListener('gesturechange', function(event) {
                event.preventDefault();
              });
              document.addEventListener('gestureend', function(event) {
                event.preventDefault();
              });

              // Impedir zoom automático do Safari em inputs
              document.addEventListener('focusin', function(event) {
                if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
                  // Forçar viewport a não fazer zoom
                  const viewport = document.querySelector('meta[name=viewport]');
                  if (viewport) {
                    const content = viewport.getAttribute('content');
                    viewport.setAttribute('content', content + ', user-scalable=no');
                    setTimeout(function() {
                      viewport.setAttribute('content', content);
                    }, 100);
                  }
                }
              });

              // Prevenir zoom em inputs no iOS
              const inputs = document.querySelectorAll('input, textarea, select');
              inputs.forEach(function(input) {
                input.addEventListener('focus', function() {
                  // Manter o zoom atual
                  const currentZoom = window.visualViewport ? window.visualViewport.scale : 1;
                  if (currentZoom > 1) {
                    // Se já está com zoom, não permitir mais zoom
                    event.preventDefault();
                  }
                });
              });
            `
          }}
        />
      </head>
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  )
}
