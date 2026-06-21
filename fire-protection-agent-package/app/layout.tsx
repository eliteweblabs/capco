export const metadata = {
  title: 'Fire Protection Agent',
  description: 'AI-powered fire protection document generation system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
