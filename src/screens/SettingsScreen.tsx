import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../lib/theme';
import { clearStoredResume } from '../lib/api';
import { useResumeStore } from '../lib/store';

const Row = ({ icon, label, value, onPress, destructive, colors, accent }: any) => (
  <TouchableOpacity
    style={{
      flexDirection: 'row', alignItems: 'center', padding: 14,
      backgroundColor: colors.surface, marginBottom: 1,
    }}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Ionicons name={icon} size={20} color={destructive ? colors.error : accent} style={{ marginRight: 12 }} />
    <Text style={{ flex: 1, fontSize: 16, color: destructive ? colors.error : colors.text }}>{label}</Text>
    {value && <Text style={{ fontSize: 14, color: colors.textMuted, marginRight: 8 }}>{value}</Text>}
    {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { colors, accent } = useTheme();
  const router = useRouter();
  const { resume, clear } = useResumeStore();

  const handleClearResume = () => {
    Alert.alert(
      'Clear Resume',
      'This will remove your resume from this device. You will need to upload it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearStoredResume();
            clear();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/');
          },
        },
      ]
    );
  };

  const s = styles(colors);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Settings</Text>

      {/* Resume section */}
      <Text style={s.sectionLabel}>Resume</Text>
      <View style={s.section}>
        <Row
          icon="person-outline"
          label="Current resume"
          value={resume?.name ?? 'None'}
          colors={colors}
          accent={accent}
        />
        <Row
          icon="cloud-upload-outline"
          label="Upload new resume"
          onPress={() => { clear(); router.replace('/'); }}
          colors={colors}
          accent={accent}
        />
        {resume && (
          <Row
            icon="trash-outline"
            label="Clear resume from device"
            onPress={handleClearResume}
            destructive
            colors={colors}
            accent={accent}
          />
        )}
      </View>

      {/* Privacy section */}
      <Text style={s.sectionLabel}>Privacy</Text>
      <View style={s.section}>
        <View style={{ padding: 14, backgroundColor: colors.surface }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={18} color={accent} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Your data stays on your device</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
            Your resume PDF is never uploaded to any server. Only the text content is sent to our AI for analysis, and it is not stored after processing.
          </Text>
        </View>
      </View>

      {/* About section */}
      <Text style={s.sectionLabel}>About</Text>
      <View style={s.section}>
        <Row icon="globe-outline" label="Website" value="chihho-dev.info" colors={colors} accent={accent} />
        <Row icon="information-circle-outline" label="Version" value="1.0.0" colors={colors} accent={accent} />
      </View>
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  content:      { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 40 },
  heading:      { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 24 },
  sectionLabel: { fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginLeft: 4 },
  section:      { borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
});
