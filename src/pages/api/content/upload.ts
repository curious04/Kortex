import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { isOwner } from '../../../config';
import { uploadFile } from '../../../lib/github';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }

  // Convert to base64
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  // Sanitize filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `content/assets/${Date.now()}-${safeName}`;

  try {
    if (!isOwner(session.username)) {
      return new Response(JSON.stringify({ error: 'Only the owner can upload files directly' }), {
        status: 403,
      });
    }

    const result = await uploadFile(session.token, path, base64, `Upload: ${safeName}`);
    const downloadUrl = result.content.download_url;

    return new Response(JSON.stringify({ success: true, url: downloadUrl, path }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
