// career-forge/src/lib/location.ts
// Optional device location lookup for job search — coarse (city-level) only,
// never required. User can always type a location manually instead.
import * as Location from 'expo-location';

export async function getCurrentCityLocation(): Promise<string | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return null; // user declined — caller should fall back to manual entry
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low, // city-level is enough for job search
  });

  const [place] = await Location.reverseGeocodeAsync({
    latitude:  position.coords.latitude,
    longitude: position.coords.longitude,
  });

  if (!place) return null;

  // prefer "City, State" format, fall back to whatever fields are available
  const city  = place.city ?? place.subregion ?? '';
  const state = place.region ?? '';

  if (city && state) return `${city}, ${state}`;
  return city || state || null;
}