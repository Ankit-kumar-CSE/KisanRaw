// Central app state: session, profile, bookings, notifications, connectivity.
// Screens call services and dispatch refreshed data here.
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { loadJSON, saveJSON, KEYS } from '../utils/storage';
import * as authService from '../services/authService';
import * as bookingService from '../services/bookingService';
import * as profileService from '../services/profileService';
import * as notificationService from '../services/notificationService';

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

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const onboardingDone = await loadJSON(KEYS.onboarding, false);
      let session = null;
      let profile = null;
      let bookings = [];
      let notifications = [];
      try {
        session = await authService.getSession();
        if (session) {
          profile = await profileService.getFarmerProfile();
          if (profile && !(profile.name && profile.village)) profile = null;
          bookings = await bookingService.getBookings();
          notifications = await notificationService.getNotifications();
        }
      } catch {
        session = null;
      }
      dispatch({ type: 'BOOT', payload: { session, profile, bookings, notifications, onboardingDone } });
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
      try {
        const notifications = await notificationService.addNotification(n);
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      } catch {
        const notifications = [{ id: `n${Date.now()}`, read: false, ...n }, ...state.notifications];
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      }
    },
    markAllRead: async () => {
      try {
        const notifications = await notificationService.markNotificationsRead();
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      } catch {
        const notifications = state.notifications.map((n) => ({ ...n, read: true }));
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      }
    },
    logout: async () => {
      await authService.logout();
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_PROFILE', payload: null });
      dispatch({ type: 'SET_BOOKINGS', payload: [] });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
    },
  };

  const value = { ...state, ...actions };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function activeBookingOf(bookings) {
  return bookings.find((b) => !['payment-completed', 'cancelled'].includes(b.status)) || null;
}
