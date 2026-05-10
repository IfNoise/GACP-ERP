import { type NextRequest, NextResponse } from 'next/server';

const SPATIAL_SERVICE_URL = process.env['SPATIAL_SERVICE_URL'] ?? 'http://localhost:3007';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contentType = request.headers.get('content-type') ?? '';

  const upstream = `${SPATIAL_SERVICE_URL}/internal/buildings/${id}/model/upload`;

  const res = await fetch(upstream, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: await request.arrayBuffer(),
  });

  const data: unknown = await res.json().catch(() => ({ message: 'Upload failed' }));
  return NextResponse.json(data, { status: res.status });
}
