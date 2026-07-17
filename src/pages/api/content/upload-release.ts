import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { isOwner } from '../../../config';
import { uploadToRelease } from '../../../lib/github';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  if (!isOwner(session.username)) {
    return new Response(JSON.stringify({ error: 'Only the owner can upload large files' }), {
      status: 403,
    });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const asset = await uploadToRelease(session.token, safeName, buffer, file.type || 'application/octet-stream');
    return new Response(
      JSON.stringify({ success: true, url: asset.browser_download_url, name: safeName }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
