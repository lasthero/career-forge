// career-forge/app/_layout.tsx
// Root layout — wraps all routes with gesture handler and status bar
import 'expo-crypto'; // polyfills crypto.getRandomValues for Crypto.randomUUID()
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          contentStyle: {
            backgroundColor: isDark ? '#000000' : '#f2f2f7',
          },
        }}
      />
    </GestureHandlerRootView>
  );
}
