import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIBOS Main Dev Sandbox',
  description: 'Development and testing dashboard for AIBOS ERP modules',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
