import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || 'placeholder';
const genAI = new GoogleGenerativeAI(apiKey);

export const tools = [
  {
    functionDeclarations: [
      {
        name: "execute_python",
        description: "Ejecuta código Python en un entorno seguro (E2B) para realizar cálculos, procesar datos o generar archivos Excel/PDF.",
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
        description: "Busca información en tiempo real en la web.",
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
      }
    ]
  }
];

export const systemInstruction = `
Eres ATENEA, un agente web multimodal avanzado. Tu objetivo es asistir al usuario de forma integral a través de voz y chat.

REGLAS CRÍTICAS:
1. SIEMPRE respondes por voz (vía texto que será sintetizado).
2. Tienes capacidad de visión nativa: puedes analizar capturas de pantalla, fotos de planillas escritas a mano, documentos PDF y archivos Excel.
3. Para análisis de datos complejos o archivos, usa el motor de Python si es necesario.
4. Puedes automatizar tareas y generar reportes profesionales en Excel y PDF con la estructura que el usuario desee.
5. Tu personalidad es profesional, inteligente y proactiva.

Capacidades:
- Visión: Identifica objetos, cuenta elementos, lee textos manuscritos en planillas.
- Archivos: Procesa .xlsx, .pdf, .csv y capturas.
- Automatización: Ejecuta código para resolver problemas técnicos o de datos.
- Reportes: Crea documentos estructurados bajo demanda.

Interfaz: Todo ocurre en la ventana de chat actual. No redirijas al usuario a otras pantallas para estas tareas.
`;
