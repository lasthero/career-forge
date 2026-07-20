// Root layout — wraps all routes with gesture handler and status bar
import 'expo-crypto'
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// log all unhandled errors to Metro console
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error(`[${isFatal ? 'FATAL' : 'ERROR'}]`, error.message);
  console.error(error.stack);
});

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
