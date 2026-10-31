import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

if (process.env.NODE_ENV !== 'development' || process.env.FDC_MOCK_MEMBERS_API !== '1') {
  throw new Error('This mock is restricted to explicitly enabled local development.');
}

const secret = process.env.MEMBERS_ADMIN_SECRET || '';
if (secret.length < 32) throw new Error('Set a staging MEMBERS_ADMIN_SECRET (32+ chars).');

const server = createServer((request, response) => {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    let body = {};
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ success: false }));
      return;
    }

    const supplied = Buffer.from(String(body.secret || ''));
    const expected = Buffer.from(secret);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ success: false }));
      return;
    }

    const action = new URL(request.url || '/', 'http://127.0.0.1').searchParams.get('action');
    const supported = new Set([
      'admin_add_student',
      'admin_edit_student',
      'admin_set_password',
      'admin_toggle_student',
    ]);
    response.writeHead(supported.has(action) ? 200 : 404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ success: supported.has(action) }));
  });
});

server.listen(Number(process.env.MEMBERS_MOCK_PORT || 8765), '127.0.0.1', () => {
  console.log(`Local members API mock listening on 127.0.0.1:${process.env.MEMBERS_MOCK_PORT || 8765}`);
});
