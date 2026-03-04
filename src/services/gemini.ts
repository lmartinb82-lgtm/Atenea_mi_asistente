import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || 'placeholder';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const genAI = new GoogleGenerativeAI(apiKey);

export const tools = [
  {
    functionDeclarations: [
      {
        name: "execute_python",
        description: "Ejecuta código Python en un entorno seguro (E2B) para realizar cálculos matemáticos exactos o procesar archivos complejos.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            code: {
              type: SchemaType.STRING,
              description: "El código Python a ejecutar."
            }
          },
          required: ["code"]
        }
      },
      {
        name: "google_search",
        description: "Busca información en tiempo real en internet para investigar normativas, productos o datos actualizados.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "La consulta de búsqueda."
            }
          },
          required: ["query"]
        }
      },
      {
        name: "generate_report",
        description: "Genera automáticamente un reporte profesional en PDF o Excel para el usuario.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              enum: ["pdf", "excel"],
              description: "El formato del reporte."
            },
            data: {
              type: SchemaType.STRING,
              description: "El contenido o datos estructurados para el reporte."
            }
          },
          required: ["type", "data"]
        }
      }
    ]
  }
];

export const systemInstruction = `
Eres ATENEA, un agente web multimodal de vanguardia basado en Gemini 2.0 Flash.

TU MISIÓN:
Eres el núcleo de inteligencia de un portal avanzado. Debes asistir al usuario con precisión técnica, visión computacional y ejecución de código autónoma.

REGLAS DE ORO:
1. IDENTIDAD: Eres ATENEA. Tu tono es profesional, proactivo y futurista.
2. VOZ: Responde de forma que tu texto sea agradable al ser sintetizado por voz. Evita listas excesivamente largas a menos que se te pida.
3. VISIÓN: Puedes analizar imágenes de webcam y archivos. Eres experta en planillas manuscritas y protocolos NIR.
4. HERRAMIENTAS:
   - Usa 'execute_python' para lógica de datos compleja.
   - Usa 'google_search' para información externa.
   - Usa 'generate_report' cuando el usuario pida un PDF o Excel con los resultados del análisis.
5. MEMORIA: Recuerda que este es un portal compartido. Mantén el orden en los proyectos.

Si el usuario te interrumpe, detén tu respuesta actual y atiende la nueva solicitud.
`;
