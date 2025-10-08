import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
    title: 'AI-BOS ERP',
    description: 'AI-BOS Enterprise Resource Planning System',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <html lang="en" style={{ colorScheme: 'dark' }}>
            <body
                className="min-h-screen"
                style={{
                    background: 'hsl(var(--aibos-semantic-background))',
                    color: 'hsl(var(--aibos-semantic-foreground))',
                    fontFamily: 'var(--aibos-font-family-sans)',
                    fontSize: 'var(--aibos-font-size-base)',
                    fontWeight: 'var(--aibos-font-weight-normal)',
                    lineHeight: '1.55'
                }}
            >
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
