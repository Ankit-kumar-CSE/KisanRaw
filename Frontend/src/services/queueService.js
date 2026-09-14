import { api } from './api';

export async function getQueueStatus(myToken, centreId) {
  const q = new URLSearchParams({ token: myToken });
  if (centreId) q.set('centreId', centreId);
  const data = await api(`/api/queue?${q.toString()}`);
  return data;
}

export function resetQueueSim() {
  /* queue cursor lives on the server */
}
