# ATENEA - Neural Intelligence Portal

ATENEA es un asistente web multimodal de vanguardia diseñado para ofrecer una experiencia de IA fluida, potente y visualmente impactante.

## 🚀 Funcionalidades Principales

- **Conversación Multimodal**: Chat y Voz en tiempo real con baja latencia.
- **Núcleo Visual Reactivo**: Interfaz futurista que reacciona según si ATENEA está escuchando, pensando o hablando.
- **Visión Nativa**: Capacidad para analizar imágenes de la webcam, capturas de pantalla y documentos (PDF, Excel, manuscritos).
- **Ejecución de Código Autónoma**: Motor Python integrado (E2B) para realizar cálculos exactos e ingeniería inversa de datos.
- **Memoria Persistente**: Gestión de proyectos y mensajes compartidos mediante Supabase.
- **Generación de Reportes**: Exportación automática de resultados a formatos PDF y Excel profesionales.
- **Interrupción Natural**: El sistema detiene la voz de la IA inmediatamente cuando el usuario empieza a hablar.

## 🛠️ Tecnologías

- **Framework**: [Next.js 15](https://nextjs.org/)
- **IA Generativa**: [Gemini 2.0 Flash](https://ai.google.dev/) (Multimodal & Tool Calling)
- **Voz**: [ElevenLabs](https://elevenlabs.io/) (Modelo Lily)
- **Código**: [E2B Code Interpreter](https://e2b.dev/)
- **Base de Datos**: [Supabase](https://supabase.com/)
- **Animaciones**: Framer Motion & Lucide React

## ⚙️ Configuración

Para desplegar este proyecto, asegúrate de configurar las siguientes variables de entorno en tu plataforma de hosting (ej. Vercel):

```env
# Gemini API Key
GEMINI_API_KEY=tu_clave_aqui

# ElevenLabs API Key
ELEVENLABS_API_KEY=tu_clave_aqui

# E2B API Key (para ejecución de Python)
E2B_API_KEY=tu_clave_aqui

# Supabase (Configuración Pública)
NEXT_PUBLIC_SUPABASE_URL=https://tu_proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui

# Google Search (Opcional para navegación web)
GOOGLE_SEARCH_API_KEY=tu_clave_aqui
GOOGLE_SEARCH_CX=tu_cx_aqui
```

### Base de Datos
Ejecuta el script contenido en `supabase_schema.sql` en tu editor SQL de Supabase para inicializar las tablas necesarias (`projects`, `messages`, `files`).

---
Desarrollado para el ecosistema de inteligencia artificial avanzada.
