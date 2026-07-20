import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, fonts } from '../lib/theme';
import { parseResume } from '../lib/api';
import { useResumeStore } from '../lib/store';

export default function UploadScreen() {
  const { colors, accent } = useTheme();
  const router = useRouter();
  const setResume = useResumeStore(s => s.setResume);

  const [status, setStatus] = useState<'idle' | 'parsing'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            // don't filter by type — let user pick anything, then validate
            copyToCacheDirectory: true,
        });

        if (result.canceled) return;
        const file = result.assets[0];

        // validate file type after selection
        if (file.mimeType !== 'application/pdf') {
            setError('Only PDF files are supported. Please select a .pdf file.');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setFileName(file.name);
        setError(null);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStatus('parsing');
        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms gives Android time to re-render

        const resumeData = await parseResume(file.uri);
        console.log('[UploadScreen] parsed resume:', resumeData.experience); // add this

        setResume(resumeData);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/resume');

    } catch (err: any) {
        setStatus('idle');
        if (err.message === 'RATE_LIMITED') {
            setError('Daily limit reached (3/day). Try again tomorrow.');
        } else {
            setError(err.message ?? 'Something went wrong. Please try again.');
        }
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    };

  const s = styles(colors, accent);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Text style={s.title}>CareerForge</Text>
        <Text style={s.subtitle}>
          Upload your resume and let AI analyze your fit for real job openings.
        </Text>
      </View>

      {[
        { icon: 'document-text-outline', label: 'Parse your resume instantly' },
        { icon: 'briefcase-outline',     label: 'Match against live job postings' },
        { icon: 'stats-chart-outline',   label: 'See your match score and gaps' },
        { icon: 'school-outline',        label: 'Get interview prep tips' },
      ].map(({ icon, label }) => (
        <View key={label} style={s.feature}>
          <Ionicons name={icon as any} size={20} color={accent} />
          <Text style={s.featureText}>{label}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[s.uploadBtn, status !== 'idle' && s.uploadBtnDisabled]}
        onPress={pick}
        disabled={status !== 'idle'}
        activeOpacity={0.8}
      >
        {status === 'idle' ? (
          <>
            <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
            <Text style={s.uploadBtnText}>Upload Resume PDF</Text>
          </>
        ) : (
          <>
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.uploadBtnText}>Parsing with AI...</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
        PDF files only
      </Text>
      {fileName && status === 'idle' && (
        <Text style={s.fileName}>{fileName}</Text>
      )}

      {error && (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      <View style={s.privacyNote}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
        <Text style={s.privacyText}>
          Your resume stays on your device. Only anonymized text is sent for AI analysis.
        </Text>
      </View>

      <Text style={s.note}>Free · 3 analyses per day · No account required</Text>
    </ScrollView>
  );
}

const styles = (colors: any, accent: string) => StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  content:           { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, minHeight: '100%' },
  header:            { marginBottom: 40 },
  title:             { fontSize: 34, fontWeight: '700', color: colors.text, marginBottom: 8, fontFamily: fonts.regular },
  subtitle:          { fontSize: 17, color: colors.textSecondary, lineHeight: 24 },
  feature:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  featureText:       { fontSize: 16, color: colors.text },
  uploadBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: accent, borderRadius: Platform.OS === 'ios' ? 14 : 8, padding: 16, marginTop: 32, marginBottom: 12 },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText:     { color: '#fff', fontSize: 17, fontWeight: '600' },
  fileName:          { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  errorBox:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 10 },
  errorText:         { color: colors.error, fontSize: 14, flex: 1 },
  privacyNote:       { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 10 },
  privacyText:       { color: colors.textMuted, fontSize: 12, flex: 1, lineHeight: 17 },
  note:              { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: 'auto', paddingTop: 24 },
});
