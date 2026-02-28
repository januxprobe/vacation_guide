import { NextRequest, NextResponse } from 'next/server';
import { getTripDataRepository } from '@/lib/repositories';
import { dayCommentSchema } from '@/lib/schemas';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const repo = getTripDataRepository();

  try {
    const comments = await repo.getComments(slug);
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const repo = getTripDataRepository();

  const body = await req.json();
  const result = dayCommentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid comment data', details: result.error.format() },
      { status: 400 }
    );
  }

  await repo.addComment(slug, result.data);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const repo = getTripDataRepository();

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing comment id' }, { status: 400 });
  }

  const deleted = await repo.deleteComment(slug, id);
  if (!deleted) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
