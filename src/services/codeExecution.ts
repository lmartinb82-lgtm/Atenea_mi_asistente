import { Sandbox } from '@e2b/code-interpreter';

export async function executePythonCode(code: string) {
  if (!process.env.E2B_API_KEY) {
    throw new Error('E2B API Key not configured');
  }

  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
  });

  try {
    const execution = await sandbox.runCode(code);

    const stdout = execution.logs.stdout.join('\n');
    const stderr = execution.logs.stderr.join('\n');
    const results = execution.results.map(r => r.text || String(r));

    return {
      logs: stdout,
      errors: stderr,
      results,
      success: true
    };
  } finally {
    await sandbox.kill();
  }
}
