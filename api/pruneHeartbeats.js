import 'dotenv/config';
import pruneOldHeartbeats from '../scripts/pruneHeartbeats.mjs';

export default async function handler() {
  try {
    const { removed, summariesUpdated } = await pruneOldHeartbeats();
    return new Response(
      JSON.stringify({ status: 'ok', removed, summariesUpdated }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌  Heartbeat prune failed:', error.message);
    return new Response(
      JSON.stringify({ status: 'error', message: error.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
