import { NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/memory';

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const project = await createProject(name);
  return NextResponse.json(project);
}
