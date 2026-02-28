import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const prompt = formData.get('prompt') as string || "Analiza esta imagen detalladamente.";

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const buffer = Buffer.from(await image.arrayBuffer());
    const imagePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: image.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
