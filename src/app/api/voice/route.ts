import { NextResponse } from 'next/server';
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const apiKey = process.env.ELEVENLABS_API_KEY || 'placeholder';
const client = new ElevenLabsClient({ apiKey });

export async function POST(req: Request) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
       return NextResponse.json({ error: 'Configura ELEVENLABS_API_KEY en Vercel' }, { status: 500 });
    }
    const { text, voiceId = 'pMs7uS1Xg70Yp9K9x8xV' } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Texto vacío' }, { status: 400 });
    }

    // Clean text for better synthesis
    const cleanText = text.replace(/[*#_~]/g, '').trim();

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: cleanText,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    return new Response(audioStream as any, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error: any) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
