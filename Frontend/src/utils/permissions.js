// Requests location + notification permissions in the correct order.
// Returns { locationGranted, notifGranted, location: { lat, lng } | null }
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export async function requestAppPermissions() {
  // --- Location ---
  let locationGranted = false;
  let location = null;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    locationGranted = status === 'granted';
    if (locationGranted) {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 8000,
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
  } catch {
    locationGranted = false;
  }

  // --- Notifications ---
  let notifGranted = false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      notifGranted = true;
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      notifGranted = status === 'granted';
    }
  } catch {
    notifGranted = false;
  }

  return { locationGranted, notifGranted, location };
}

// Watch position and call onUpdate({ lat, lng }) whenever it changes.
export function watchLocation(onUpdate) {
  let sub = null;
  Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
    (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
  ).then((s) => { sub = s; });
  return () => sub?.remove();
}
