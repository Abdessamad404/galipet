import { type PropsWithChildren } from 'react'
import { ScrollViewStyleReset } from 'expo-router/html'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr" style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #root { height: 100%; margin: 0; padding: 0; }
          `
        }} />
      </head>
      <body style={{ height: '100%' }}>
        {children}
      </body>
    </html>
  )
}
