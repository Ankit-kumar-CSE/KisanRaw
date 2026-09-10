// QUEUE SERVICE — simulates a live queue at the centre.
// Replace with WebSocket/Socket.IO subscription later; UI polls this fn.
import { delay } from '../utils/storage';

const state = { lastAdvanceAt: 0, cursor: null };

// Builds a token window around the farmer's own token, e.g. A-238…A-249.
function buildQueue(myToken) {
  const num = parseInt(String(myToken).replace(/[^0-9]/g, ''), 10) || 247;
  const start = num - 9;
  const tokens = Array.from({ length: 12 }, (_, i) => `A-${start + i}`);
  return { num, tokens };
}

export async function getQueueStatus(myToken) {
  await delay(900);
  const { num, tokens } = buildQueue(myToken);

  // advance the queue ~1 token per 6s of real time (demo pace)
  const now = Date.now();
  if (state.cursor == null || state.cursor > num) state.cursor = num - 7;
  if (now - state.lastAdvanceAt > 6000) {
    state.cursor = Math.min(state.cursor + 1, num);
    state.lastAdvanceAt = now;
  }

  const cursor = state.cursor;
  const queue = tokens.map((t) => {
    const n = parseInt(t.slice(2), 10);
    return {
      token: t,
      state: n < cursor ? 'done' : n === cursor ? 'current' : 'waiting',
      isYou: n === num,
    };
  });

  const ahead = Math.max(0, num - cursor - 1);
  const counter = 1 + (cursor % 3);
  return {
    myToken,
    currentToken: `A-${cursor}`,
    farmersAhead: ahead,
    yourTurn: ahead === 0,
    estWaitMins: Math.max(2, ahead * 4 + 2),
    counter,
    queue,
    lastUpdated: new Date().toISOString(),
  };
}

export function resetQueueSim() {
  state.cursor = null;
  state.lastAdvanceAt = 0;
}
