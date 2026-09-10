// Central app state: session, profile, bookings, notifications, connectivity.
// Screens never touch AsyncStorage directly — they call services and dispatch
// refreshed data here, so swapping mock services for a real API changes nothing.
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { loadJSON, saveJSON, KEYS } from '../utils/storage';
import * as authService from '../services/authService';
import * as bookingService from '../services/bookingService';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const initialState = {
  booted: false,
  session: null,
  profile: null,
  onboardingDone: false,
  bookings: [],
  notifications: [],
  online: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, ...action.payload, booted: true };
    case 'SET_SESSION': return { ...state, session: action.payload };
    case 'SET_PROFILE': return { ...state, profile: action.payload };
    case 'SET_BOOKINGS': return { ...state, bookings: action.payload };
    case 'SET_NOTIFICATIONS': return { ...state, notifications: action.payload };
    case 'SET_ONLINE': return { ...state, online: action.payload };
    case 'ONBOARDING_DONE': return { ...state, onboardingDone: true };
    default: return state;
  }
}

const SEED_NOTIFICATIONS = [
  { id: 'n1', category: 'queue', text: 'Your slot is confirmed for tomorrow at 10 AM.', at: 'Today, 08:32 AM', read: false },
  { id: 'n2', category: 'payment', text: 'Your payment of ₹84,045 for Paddy 38.5 Q has been completed.', at: '2 Sep, 4:15 PM', read: false },
  { id: 'n3', category: 'announcement', text: 'Phagwara Centre will remain open till 6 PM during Rabi peak.', at: '1 Sep, 10:00 AM', read: true },
];

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Boot: restore everything persisted, subscribe to connectivity.
  useEffect(() => {
    (async () => {
      const [session, profile, bookings, notifications, onboardingDone] = await Promise.all([
        authService.getSession(),
        loadJSON(KEYS.profile, null),
        bookingService.seedHistory(),
        loadJSON(KEYS.notifications, null),
        loadJSON(KEYS.onboarding, false),
      ]);
      let notifs = notifications;
      if (!notifs) { notifs = SEED_NOTIFICATIONS; saveJSON(KEYS.notifications, notifs); }
      dispatch({ type: 'BOOT', payload: { session, profile, bookings, notifications: notifs, onboardingDone } });
    })();

    const unsub = NetInfo.addEventListener((net) => {
      dispatch({ type: 'SET_ONLINE', payload: !!(net.isConnected && net.isInternetReachable !== false) });
    });
    return unsub;
  }, []);

  const actions = {
    completeOnboarding: async () => {
      await saveJSON(KEYS.onboarding, true);
      dispatch({ type: 'ONBOARDING_DONE' });
    },
    setSession: (session) => dispatch({ type: 'SET_SESSION', payload: session }),
    setProfile: (profile) => dispatch({ type: 'SET_PROFILE', payload: profile }),
    refreshBookings: async () => {
      const bookings = await bookingService.getBookings();
      dispatch({ type: 'SET_BOOKINGS', payload: bookings });
    },
    pushNotification: async (n) => {
      const notifications = [{ id: `n${Date.now()}`, read: false, ...n }, ...state.notifications];
      await saveJSON(KEYS.notifications, notifications);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    },
    markAllRead: async () => {
      const notifications = state.notifications.map((n) => ({ ...n, read: true }));
      await saveJSON(KEYS.notifications, notifications);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    },
    logout: async () => {
      await authService.logout();
      dispatch({ type: 'SET_SESSION', payload: null });
    },
  };

  const value = { ...state, ...actions };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function activeBookingOf(bookings) {
  return bookings.find((b) => !['payment-completed', 'cancelled'].includes(b.status)) || null;
}
