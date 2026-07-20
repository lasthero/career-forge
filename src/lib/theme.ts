// Theme system — iOS/Android native colors, dark/light mode support
import { Platform, useColorScheme } from 'react-native';

// iOS uses SF Pro (system font), Android uses Roboto
export const fonts = {
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  mono:    Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};

const darkColors = {
  background:    '#000000',
  surface:       '#1c1c1e',
  surfaceAlt:    '#2c2c2e',
  border:        '#38383a',
  text:          '#ffffff',
  textSecondary: '#ebebf5cc',
  textMuted:     '#ebebf580',
  accent:        '#0a84ff',
  accentAndroid: '#bb86fc',
  success:       '#30d158',
  warning:       '#ffd60a',
  error:         '#ff453a',
  card:          '#1c1c1e',
};

const lightColors = {
  background:    '#f2f2f7',
  surface:       '#ffffff',
  surfaceAlt:    '#f2f2f7',
  border:        '#c6c6c8',
  text:          '#000000',
  textSecondary: '#3c3c4399',
  textMuted:     '#3c3c4360',
  accent:        '#007aff',
  accentAndroid: '#6200ee',
  success:       '#34c759',
  warning:       '#ff9500',
  error:         '#ff3b30',
  card:          '#ffffff',
};

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    accent: Platform.OS === 'android' ? colors.accentAndroid : colors.accent,
  };
}

export type Theme = ReturnType<typeof useTheme>;