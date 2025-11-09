import { runCdnIntegrityCheck } from '../scripts/checkCdnIntegrity.mjs';

export default async function handler() {
  try {
    await runCdnIntegrityCheck();
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ CDN integrity check failed:', error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
