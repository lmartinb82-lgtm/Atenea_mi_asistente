import { NextResponse } from 'next/server';
import { executePythonCode } from '@/services/codeExecution';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const result = await executePythonCode(code);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Code Execution Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
