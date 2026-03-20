import type { Metadata, Viewport } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/Context/AuthContext';
import NavBar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Toaster } from '@/app/components/Toaster';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SmartFin MW — Beat Malawi Inflation', template: '%s | SmartFin MW' },
  description: "Track expenses, compare prices, and get AI-powered financial advice tailored for Malawi's 28.7% inflation.",
  keywords: ['Malawi', 'finance', 'inflation', 'MWK', 'budget', 'savings', 'kwacha'],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SmartFin' },
};

export const viewport: Viewport = {
  themeColor: '#1e1b4b',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="font-sans flex flex-col min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}