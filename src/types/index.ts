export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  type?: 'text' | 'image' | 'file' | 'code';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}
