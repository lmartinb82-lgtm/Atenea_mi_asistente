import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemInstruction, tools } from '@/services/gemini';
import { saveMessage } from '@/lib/memory';

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

    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const currentParts: any[] = [{ text: lastUserMessage.content }];

    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      currentParts.push({
        inlineData: { data: base64Data, mimeType: mimeType },
      });
    }

    if (fileData) {
      // If it's already extracted text or a small document
      currentParts.push({ text: `[Archivo Adjunto]: ${fileData}` });
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(currentParts);

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullResponse += chunkText;
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text: chunkText }) + "\n"));
          }
        }
        if (projectId && fullResponse) {
          await saveMessage(projectId, 'assistant', fullResponse);
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
