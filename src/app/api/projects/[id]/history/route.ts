import { NextResponse } from 'next/server';
import { getProjectHistory } from '@/lib/memory';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const history = await getProjectHistory(id);
  return NextResponse.json(history);
}
