import { api } from './api';

export async function getNotifications() {
  const data = await api('/api/notifications');
  return data.notifications || [];
}

export async function addNotification(n) {
  const data = await api('/api/notifications', { method: 'POST', body: n });
  return data.notifications || [];
}

export async function markNotificationsRead() {
  const data = await api('/api/notifications/read-all', { method: 'POST' });
  return data.notifications || [];
}
