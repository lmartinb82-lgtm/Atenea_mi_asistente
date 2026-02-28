import { Sandbox } from '@e2b/code-interpreter';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY!,
    });

    const execution = await sandbox.runCode(code);

    // Extract logs and result
    const stdout = execution.logs.stdout.join('\n');
    const stderr = execution.logs.stderr.join('\n');
    const results = execution.results.map(r => r.text || String(r));

    await sandbox.kill();

    return NextResponse.json({
      logs: stdout,
      errors: stderr,
      results,
      success: true
    });

  } catch (error: any) {
    console.error('Code Execution Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
