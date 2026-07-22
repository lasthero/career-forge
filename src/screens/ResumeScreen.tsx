// career-forge/src/screens/ResumeScreen.tsx
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, fonts } from '../lib/theme';
import { useResumeStore } from '../lib/store';
import { clearStoredResume } from '../lib/api';

const Tag = ({ label, colors, accent }: { label: string; colors: any; accent: string }) => (
  <View style={{
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: accent + '40',
  }}>
    <Text style={{ color: accent, fontSize: 12, fontFamily: fonts.mono }}>{label}</Text>
  </View>
);

const Section = ({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
      {title}
    </Text>
    {children}
  </View>
);

export default function ResumeScreen() {
  const { colors, accent } = useTheme();
  const router = useRouter();
  const { resume, clear } = useResumeStore();

  useEffect(() => {
    if (!resume) {
      router.replace('/');
    }
  }, [resume]);

  if (!resume) return null;
  const s = styles(colors, accent);

  const handleUploadDifferent = async () => {
    await clearStoredResume(); // clear SecureStore first
    clear();                   // then clear Zustand — triggers the redirect above
  };

  // guard every field — the AI-parsed schema may omit optional sections
  // depending on the candidate's field/industry
  const skills          = resume.skills ?? {};
  const experience      = resume.experience ?? [];
  const education        = resume.education ?? [];
  const credentials      = resume.credentials ?? [];
  const achievements     = resume.achievements ?? [];
  const additional       = resume.additional ?? [];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.card}>
        <Text style={s.name}>{resume.name}{resume.alias ? ` (${resume.alias})` : ''}</Text>
        <Text style={s.title}>{resume.title}</Text>
        {resume.industry && (
          <View style={{ marginTop: 4 }}>
            <Tag label={resume.industry} colors={colors} accent={accent} />
          </View>
        )}
        <View style={s.contactRow}>
          {resume.contact?.email && (
            <Text style={s.contact}>{resume.contact.email}</Text>
          )}
        </View>
      </View>

      {/* Skills */}
      {Object.keys(skills).length > 0 && (
        <View style={s.card}>
          <Section title="Skills" colors={colors}>
            {Object.entries(skills).map(([category, items]) => (
              <View key={category} style={{ marginBottom: 12 }}>
                <Text style={s.categoryLabel}>{category}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {(items ?? []).map(skill => <Tag key={skill} label={skill} colors={colors} accent={accent} />)}
                </View>
              </View>
            ))}
          </Section>
        </View>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <View style={s.card}>
          <Section title="Experience" colors={colors}>
            {experience.map((job, i) => (
              <View key={i} style={s.jobEntry}>
                <View style={s.jobHeader}>
                  <Text style={s.jobTitle}>{job.title}</Text>
                  <Text style={s.jobPeriod}>{job.period}</Text>
                </View>
                <Text style={s.jobCompany}>{job.company}</Text>
                {(job.bullets ?? []).map((b, j) => (
                  <Text key={j} style={s.bullet}>• {b}</Text>
                ))}
              </View>
            ))}
            {additional.length > 0 && (
              <Text style={s.additional}>+ {additional.join(' · ')}</Text>
            )}
          </Section>
        </View>
      )}

      {/* Education */}
      {education.length > 0 && (
        <View style={s.card}>
          <Section title="Education" colors={colors}>
            {education.map((ed, i) => (
              <View key={i} style={s.certRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.certName}>{ed.degree}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{ed.institution}</Text>
                </View>
                {ed.year && <Text style={s.certYear}>{ed.year}</Text>}
              </View>
            ))}
          </Section>
        </View>
      )}

      {/* Credentials (certifications, licenses, bar admissions, etc.) */}
      {credentials.length > 0 && (
        <View style={s.card}>
          <Section title="Credentials" colors={colors}>
            {credentials.map((cred, i) => (
              <View key={i} style={s.certRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.certName}>{cred.name}</Text>
                  {cred.issuer && (
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{cred.issuer}</Text>
                  )}
                </View>
                {cred.year && <Text style={s.certYear}>{cred.year}</Text>}
              </View>
            ))}
          </Section>
        </View>
      )}

      {/* Achievements (quota attainment, publications, awards, etc.) */}
      {achievements.length > 0 && (
        <View style={s.card}>
          <Section title="Achievements" colors={colors}>
            {achievements.map((ach, i) => (
              <Text key={i} style={s.bullet}>• {ach}</Text>
            ))}
          </Section>
        </View>
      )}

      {/* Find jobs CTA */}
      <TouchableOpacity style={s.cta} onPress={() => router.push('/jobs')} activeOpacity={0.8}>
        <Ionicons name="briefcase-outline" size={20} color="#fff" />
        <Text style={s.ctaText}>Find Matching Jobs</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Replace resume */}
      <TouchableOpacity style={s.secondaryBtn} onPress={handleUploadDifferent}>
        <Text style={s.secondaryBtnText}>Upload Different Resume</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (colors: any, accent: string) => StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  content:       { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 40 },
  card:          { backgroundColor: colors.surface, borderRadius: Platform.OS === 'ios' ? 12 : 8, padding: 16, marginBottom: 12 },
  name:          { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  title:         { fontSize: 16, color: accent, marginBottom: 8 },
  contactRow:    { flexDirection: 'row', gap: 12 },
  contact:       { fontSize: 13, color: colors.textSecondary },
  categoryLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6, fontWeight: '500' },
  jobEntry:      { marginBottom: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  jobHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  jobTitle:      { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  jobPeriod:     { fontSize: 12, color: colors.textMuted },
  jobCompany:    { fontSize: 14, color: accent, marginBottom: 6 },
  bullet:        { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 3 },
  additional:    { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  certRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  certName:      { fontSize: 14, color: colors.text },
  certYear:      { fontSize: 13, color: colors.textMuted, marginLeft: 8 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: accent, borderRadius: Platform.OS === 'ios' ? 14 : 8,
    padding: 16, marginBottom: 12, marginTop: 8,
  },
  ctaText:       { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondaryBtn:  { alignItems: 'center', padding: 12 },
  secondaryBtnText: { color: colors.textMuted, fontSize: 15 },
});
