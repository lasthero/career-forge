// career-forge/src/screens/MatchDetailScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, fonts } from '../lib/theme';
import { useResumeStore } from '../lib/store';
import { getInterviewPrep } from '../lib/api';

const Tag = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 }}>
    <Text style={{ color, fontSize: 12 }}>{label}</Text>
  </View>
);

export default function MatchDetailScreen() {
  const { colors, accent } = useTheme();
  const router = useRouter();
  const { selectedJob, resume, interviewPrep, setInterviewPrep } = useResumeStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrep, setShowPrep] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!selectedJob) {
    router.back();
    return null;
  }

  const recColor = selectedJob.recommendation === 'strong yes' || selectedJob.recommendation === 'yes'
    ? '#30d158' : selectedJob.recommendation === 'maybe' ? '#ffd60a' : '#ff453a';

  const fetchPrep = async () => {
    if (!resume) return;
    setLoading(true);
    setError(null);
    try {
      const prep = await getInterviewPrep(
        resume,
        selectedJob.jobTitle,
        selectedJob.company,
      );
      setInterviewPrep(prep);
      setShowPrep(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message === 'RATE_LIMITED'
        ? 'Daily limit reached. Try again tomorrow.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors, accent);
  const description = selectedJob.description ?? '';
  const descriptionPreview = description.slice(0, 400);
  const hasMoreDescription = description.length > 400;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Back — larger hit area, explicit zIndex so nothing overlaps it */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={s.backBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 20 }}
        activeOpacity={0.6}
      >
        <Ionicons name="chevron-back" size={22} color={accent} />
        <Text style={{ color: accent, fontSize: 16, fontWeight: '500' }}>Jobs</Text>
      </TouchableOpacity>

      {/* Job header */}
      <View style={s.card}>
        <Text style={s.jobTitle}>{selectedJob.jobTitle}</Text>
        <Text style={s.company}>{selectedJob.company}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={s.location}>{selectedJob.location}{selectedJob.remote ? ' · Remote' : ''}</Text>
        </View>
        {selectedJob.salary?.display && (
          <Text style={s.salary}>{selectedJob.salary.display}</Text>
        )}
      </View>

      {/* Match score */}
      <View style={s.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={s.sectionLabel}>Match Score</Text>
          <View style={{ backgroundColor: recColor + '20', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: recColor, fontSize: 12, fontWeight: '600' }}>
              {selectedJob.recommendation.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${selectedJob.matchScore}%`, height: '100%', backgroundColor: recColor, borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: recColor }}>{selectedJob.matchScore}%</Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 }}>
          {selectedJob.matchSummary}
        </Text>
      </View>

      {/* Requirements / description */}
      {description.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionLabel}>Job Requirements</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 8 }}>
            {showFullDescription ? description : descriptionPreview}
            {!showFullDescription && hasMoreDescription ? '…' : ''}
          </Text>
          {hasMoreDescription && (
            <TouchableOpacity
              onPress={() => setShowFullDescription(v => !v)}
              style={{ marginTop: 8 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: accent, fontSize: 13, fontWeight: '600' }}>
                {showFullDescription ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Strengths */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Your Strengths</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {selectedJob.strengths.map(str => (
            <Tag key={str} label={str} color="#30d158" bg="#30d15820" />
          ))}
        </View>
      </View>

      {/* Gaps */}
      {selectedJob.gaps.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionLabel}>Skill Gaps</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {selectedJob.gaps.map(g => (
              <Tag key={g} label={g} color={colors.textSecondary} bg={colors.surfaceAlt} />
            ))}
          </View>
        </View>
      )}

      {/* Apply button */}
      {selectedJob.applyUrl && (
        <TouchableOpacity
          style={s.applyBtn}
          onPress={() => Linking.openURL(selectedJob.applyUrl)}
          activeOpacity={0.8}
        >
          <Text style={s.applyBtnText}>Apply Now</Text>
          <Ionicons name="open-outline" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Interview prep */}
      {!showPrep ? (
        <TouchableOpacity style={s.prepBtn} onPress={fetchPrep} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color={accent} size="small" />
            : <Ionicons name="school-outline" size={20} color={accent} />
          }
          <Text style={[s.prepBtnText, { color: accent }]}>
            {loading ? 'Generating prep tips...' : 'Get Interview Prep Tips'}
          </Text>
        </TouchableOpacity>
      ) : interviewPrep && (
        <>
          <Text style={[s.sectionLabel, { marginTop: 8, marginBottom: 12 }]}>Interview Prep</Text>

          <View style={s.card}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              {interviewPrep.overview}
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.sectionLabel}>Likely Questions</Text>
            {interviewPrep.likelyQuestions.map((q, i) => (
              <View key={`q-${i}`} style={s.questionCard}>
                <Text style={s.question}>Q: {q.question}</Text>
                <Text style={s.tip}>{q.tipToAnswer}</Text>
              </View>
            ))}
          </View>

          <View style={s.card}>
            <Text style={[s.sectionLabel, { color: colors.text, opacity: 0.85 }]}>Strengths to Highlight</Text>
            {interviewPrep.strengthsToHighlight.map((str, i) => (
              <Text key={`sh-${i}`} style={[s2.bullet, { color: colors.text }]}>• {str}</Text>
            ))}
          </View>

          {interviewPrep.gapsToAddress.length > 0 && (
            <View style={s.card}>
              <Text style={[s.sectionLabel, { color: colors.text, opacity: 0.85 }]}>How to Address Gaps</Text>
              {interviewPrep.gapsToAddress.map((g, i) => (
                <Text key={`ga-${i}`} style={[s2.bullet, { color: colors.text }]}>• {g}</Text>
              ))}
            </View>
          )}

          <View style={s.card}>
            <Text style={[s.sectionLabel, { color: colors.text, opacity: 0.85 }]}>General Tips</Text>
            {interviewPrep.generalTips.map((tip, i) => (
              <Text key={`gt-${i}`} style={[s2.bullet, { color: colors.text }]}>• {tip}</Text>
            ))}
          </View>
        </>
      )}

      {error && (
        <Text style={{ color: colors.error, fontSize: 14, textAlign: 'center', marginTop: 8 }}>{error}</Text>
      )}
    </ScrollView>
  );
}

const styles = (colors: any, accent: string) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  content:      { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 40 },
  backBtn:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16, alignSelf: 'flex-start', paddingVertical: 6, paddingRight: 12, zIndex: 10 },
  card:         { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  jobTitle:     { fontSize: 22, fontWeight: '700', color: colors.text },
  company:      { fontSize: 16, color: accent, marginTop: 4 },
  location:     { fontSize: 13, color: colors.textMuted },
  salary:       { fontSize: 14, color: colors.textSecondary, marginTop: 6, fontWeight: '500' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  applyBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: accent, borderRadius: Platform.OS === 'ios' ? 14 : 8, padding: 16, marginBottom: 12, marginTop: 4 },
  applyBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  prepBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: accent, borderRadius: Platform.OS === 'ios' ? 14 : 8, padding: 16, marginBottom: 20 },
  prepBtnText:  { fontSize: 16, fontWeight: '600' },
  questionCard: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  question:     { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  tip:          { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});

const s2 = StyleSheet.create({
  bullet: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
