import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIBOS ERP - Module Launcher',
  description: 'Master dashboard for launching and testing AIBOS ERP modules',
};

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
        {children}
      </body>
    </html>
  );
}
