import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voice Receptionist AI — Never Miss a Call. Never Lose a Customer.',
  description:
    'Bilingual English/Vietnamese AI voice receptionist for Vietnamese nail salons and restaurants. Answers every call 24/7, books appointments, takes orders.',
  openGraph: {
    title: 'Voice Receptionist AI',
    description:
      'The AI receptionist that speaks English and Vietnamese — answers every call 24/7, books appointments, takes orders.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
