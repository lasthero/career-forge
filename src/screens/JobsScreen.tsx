import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, fonts } from '../lib/theme';
import { useResumeStore } from '../lib/store';
import { matchJobs, JobMatch } from '../lib/api';

const recColors: Record<string, string> = {
  'strong yes': '#30d158',
  'yes':        '#30d158',
  'maybe':      '#ffd60a',
  'no':         '#ff453a',
};

const ScoreBar = ({ score, accent, colors }: { score: number; accent: string; colors: any }) => {
  const color = score >= 75 ? '#30d158' : score >= 50 ? '#ffd60a' : '#ff453a';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 }}>
      <View style={{ flex: 1, height: 4, backgroundColor: colors.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
      </View>
      <Text style={{ fontSize: 13, color, fontFamily: fonts.mono, minWidth: 36 }}>{score}%</Text>
    </View>
  );
};

const JobCard = ({ job, onPress, colors, accent }: { job: JobMatch; onPress: () => void; colors: any; accent: string }) => (
  <TouchableOpacity style={[styles(colors, accent).jobCard]} onPress={onPress} activeOpacity={0.7}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{job.jobTitle}</Text>
        <Text style={{ fontSize: 14, color: accent, marginTop: 2 }}>{job.company}</Text>
      </View>
      <View style={{ backgroundColor: (recColors[job.recommendation] ?? '#999') + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ color: recColors[job.recommendation] ?? '#999', fontSize: 11, fontWeight: '600' }}>
          {job.recommendation.toUpperCase()}
        </Text>
      </View>
    </View>
    <ScoreBar score={job.matchScore} accent={accent} colors={colors} />
    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={2}>
      {job.matchSummary}
    </Text>
    {job.salary?.display && (
      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>{job.salary.display}</Text>
    )}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{job.location}{job.remote ? ' · Remote' : ''}</Text>
    </View>
  </TouchableOpacity>
);

export default function JobsScreen() {
  const { colors, accent } = useTheme();
  const router = useRouter();
  const { resume, matchResult, setMatchResult, setSelectedJob } = useResumeStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!resume) return router.replace('/');
    setLoading(true);
    setError(null);
    try {
      const result = await matchJobs(resume, query);
      setMatchResult(result);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message === 'RATE_LIMITED'
        ? 'Daily limit reached (3/day). Try again tomorrow.'
        : err.message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const onJobPress = (job: JobMatch) => {
    setSelectedJob(job);
    router.push('/match-detail');
  };

  const s = styles(colors, accent);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>Job Matches</Text>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.input}
            placeholder="senior SRE, platform engineer..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={s.searchBtn} onPress={search} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="arrow-forward" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error && (
        <View style={s.errorBox}>
          <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {matchResult && (
        <>
          <Text style={s.meta}>
            {matchResult.jobsAnalyzed} jobs analyzed · {matchResult.topMatches.length} top matches
          </Text>

          {/* Summary */}
          <View style={s.summaryCard}>
            <Text style={s.summaryText}>{matchResult.overallSummary}</Text>
          </View>

          {/* Skill gaps */}
          {matchResult.skillGaps.length > 0 && (
            <View style={s.gapsCard}>
              <Text style={s.gapsLabel}>Skill Gaps</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {matchResult.skillGaps.map(g => (
                  <View key={g} style={s.gapTag}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Job cards */}
          {matchResult.topMatches.map((job, index) => (
            <JobCard key={`${job.jobId}-${index}`} job={job} onPress={() => onJobPress(job)} colors={colors} accent={accent} />
          ))}
        </>
      )}

      {/* Empty state */}
      {!matchResult && !loading && (
        <View style={s.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
          <Text style={s.emptyText}>Search for jobs to see how your resume matches</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = (colors: any, accent: string) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  content:     { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 40 },
  heading:     { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 16 },
  searchRow:   { flexDirection: 'row', gap: 8, marginBottom: 16 },
  inputWrap:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: Platform.OS === 'ios' ? 10 : 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8 },
  input:       { flex: 1, color: colors.text, fontSize: 15 },
  searchBtn:   { backgroundColor: accent, borderRadius: Platform.OS === 'ios' ? 10 : 8, padding: 12, alignItems: 'center', justifyContent: 'center', width: 44 },
  errorBox:    { backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 12 },
  meta:        { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: accent },
  summaryText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  gapsCard:    { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 12 },
  gapsLabel:   { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  gapTag:      { backgroundColor: colors.surfaceAlt, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  jobCard:     { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  emptyState:  { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:   { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
