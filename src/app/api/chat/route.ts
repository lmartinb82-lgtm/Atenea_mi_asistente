import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemInstruction, tools } from '@/services/gemini';
import { saveMessage, getProjectHistory } from '@/lib/memory';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'placeholder');

export async function POST(req: Request) {
  try {
    const { messages, projectId, image, fileData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (projectId) {
      await saveMessage(projectId, 'user', lastUserMessage.content, (image || fileData) ? 'file' : 'text');
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
      tools: tools as any,
    });

    // Merge recent messages with historical project data
    let dbHistory: any[] = [];
    if (projectId) {
      const records = await getProjectHistory(projectId);
      dbHistory = records.slice(0, -messages.length).map((r: any) => ({
        role: r.role === 'user' ? 'user' : 'model',
        parts: [{ text: r.content }],
      }));
    }

    const recentHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const history = [...dbHistory, ...recentHistory];

    const currentParts: any[] = [{ text: lastUserMessage.content }];

    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      currentParts.push({
        inlineData: { data: base64Data, mimeType: mimeType },
      });
    }

    if (fileData) {
      const base64Data = fileData.split(',')[1];
      const mimeType = fileData.split(',')[0].split(':')[1].split(';')[0];

      if (mimeType === 'application/pdf' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        currentParts.push({
          inlineData: { data: base64Data, mimeType: mimeType },
        });
      } else {
        currentParts.push({ text: `[Archivo Adjunto]: ${fileData}` });
      }
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(currentParts);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponseText = "";

        for await (const chunk of result.stream) {
          // Check for function calls
          const calls = chunk.functionCalls();
          if (calls && calls.length > 0) {
            for (const call of calls) {
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'status', message: `Ejecutando ${call.name}...` }) + "\n"));

              let toolResult;
              if (call.name === 'execute_python') {
                const response = await fetch(`${req.url.replace('/api/chat', '/api/code')}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: (call.args as any).code }),
                });
                const data = await response.json();
                toolResult = { output: data.logs || data.results?.join('\n') || 'Ejecución completada' };
              } else if (call.name === 'google_search') {
                try {
                  const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${encodeURIComponent((call.args as any).query)}`);
                  const data = await response.json();
                  toolResult = { results: data.items?.map((i: any) => `${i.title}: ${i.snippet}`).join('\n') || 'No se encontraron resultados' };
                } catch (e) {
                  toolResult = { error: 'Error en búsqueda web' };
                }
              }

              // Send tool result back to Gemini
              const toolResponse = await chat.sendMessage([{
                functionResponse: {
                  name: call.name,
                  response: toolResult || { error: 'No se pudo obtener el resultado' }
                }
              }]);

              const toolText = toolResponse.response.text();
              fullResponseText += toolText;
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: toolText }) + "\n"));
            }
          }

          const chunkText = chunk.text();
          if (chunkText) {
            fullResponseText += chunkText;
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: chunkText }) + "\n"));
          }
        }

        if (projectId && fullResponseText) {
          await saveMessage(projectId, 'assistant', fullResponseText);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson' },
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
