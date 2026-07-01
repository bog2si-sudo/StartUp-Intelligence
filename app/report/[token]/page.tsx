import { notFound } from 'next/navigation';

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <h1>Report</h1>
      <p>Report is being generated.</p>
      <p>Token: {token}</p>
    </main>
  );
}
