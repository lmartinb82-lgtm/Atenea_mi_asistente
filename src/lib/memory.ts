import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function getProjects() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { data, error } = await supabaseServer
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error (getProjects):', error);
    return [];
  }
  return data || [];
}

export async function createProject(name: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { error: 'Supabase URL not configured' };
  }

  const { data, error } = await supabaseServer
    .from('projects')
    .insert([{ name, user_id: null }])
    .select()
    .single();

  if (error) {
    console.error('Supabase Error (createProject):', error);
    return { error: error.message };
  }
  return data;
}

export async function saveMessage(projectId: string, role: string, content: string, type: string = 'text') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data, error } = await supabaseServer
    .from('messages')
    .insert([{ project_id: projectId, role, content, type }])
    .select();

  if (error) console.error('Supabase Error (saveMessage):', error);
  return data;
}

export async function getProjectHistory(projectId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { data, error } = await supabaseServer
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) console.error('Supabase Error (getProjectHistory):', error);
  return data || [];
}
