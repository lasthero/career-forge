// API client — all server calls, device storage, session management
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY!;

// ── Device ID ─────────────────────────────────────────────────────────────────
export async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
    deviceId = Device.modelId ?? Crypto.randomUUID();;
    await SecureStore.setItemAsync('deviceId', deviceId!);
  }
  return deviceId!;
}

// ── Local resume storage ──────────────────────────────────────────────────────
export async function getStoredResume(): Promise<ResumeData | null> {
  const stored = await SecureStore.getItemAsync('resumeData');
  const parsed = stored ? JSON.parse(stored) : null;
  console.log('[SecureStore] read:', parsed?.name ?? 'null');
  console.log('[SecureStore] experience:', parsed?.experience ?? 'null');
  return stored ? JSON.parse(stored) : null;
}

export async function storeResume(resume: ResumeData): Promise<void> {
  await SecureStore.setItemAsync('resumeData', JSON.stringify(resume));
  console.log('[SecureStore] stored:', resume.name, resume.experience);

}

export async function clearStoredResume(): Promise<void> {
    console.log('[SecureStore] before clear:', await SecureStore.getItemAsync('resumeData') ? 'has data' : 'empty');

  await SecureStore.deleteItemAsync('resumeData');
    console.log('[SecureStore] after clear:', await SecureStore.getItemAsync('resumeData') ? 'has data' : 'empty');

}

// ── Types ─────────────────────────────────────────────────────────────────────
export type ResumeData = {
  name:    string;
  alias:   string | null;
  title:   string;
  contact: { email: string; linkedin: string; website: string | null };
  skills:  Record<string, string[]>;
  experience: { title: string; company: string; period: string; bullets: string[] }[];
  additional:     string[];
  certifications: { name: string; year: string }[];
};

export type JobMatch = {
  jobId:          string;
  jobTitle:       string;
  company:        string;
  location:       string;
  remote:         boolean;
  description?:   string;  
  matchScore:     number;
  matchSummary:   string;
  strengths:      string[];
  gaps:           string[];
  recommendation: 'strong yes' | 'yes' | 'maybe' | 'no';
  applyUrl:       string;
  salary?: { min: number | null; max: number | null; display: string | null };
};

export type MatchResult = {
  jobsAnalyzed:   number;
  overallSummary: string;
  topMatches:     JobMatch[];
  skillGaps:      string[];
};

export type InterviewPrep = {
  overview:             string;
  likelyQuestions:      { question: string; tipToAnswer: string }[];
  strengthsToHighlight: string[];
  gapsToAddress:        string[];
  generalTips:          string[];
};

// ── Base fetch ────────────────────────────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}) {
  const deviceId = await getDeviceId();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key':    API_KEY,
      'x-device-id':  deviceId,
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 429) throw new Error('RATE_LIMITED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.log(err)
    throw new Error(err.error ?? `API error ${res.status}`);
  }

  return res.json();
}

// ── 1. Parse resume — PDF stays on device, only base64 sent to API ───────────
// career-forge/src/lib/api.ts
export async function parseResume(fileUri: string): Promise<ResumeData> {
  const file = new File(fileUri);
  const base64 = await file.base64();

  console.log('[parseResume] fileUri:', fileUri);
  console.log('[parseResume] base64 length:', base64.length);

  // send to server — pdf2json extracts text, Bedrock parses it
  // never send raw base64 directly to Bedrock (it can't read PDF binary)
  const data = await apiFetch('/resume/parse-pdf', {
    method: 'POST',
    body: JSON.stringify({ pdfBase64: base64 }),
  });

  const resume = data.resume as ResumeData;
  console.log('[parseResume] parsed name:', resume.name);
  await storeResume(resume);
  return resume;
}

// ── 2. Match jobs — resume text passed directly, not fetched from S3 ─────────
export async function matchJobs(
  resume: ResumeData,
  query?: string
): Promise<MatchResult> {
  return apiFetch('/analyze', {
    method: 'POST',
    body: JSON.stringify({
      resumeText: JSON.stringify(resume),
      jobQuery:   query,
    }),
  });
}

// ── 3. Interview prep — reuses /career ───────────────────────────────────────
export async function getInterviewPrep(
  resume:   ResumeData,
  jobTitle: string,
  company:  string,
): Promise<InterviewPrep> {
  const data = await apiFetch('/career', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: `Give me interview prep tips for ${jobTitle} at ${company}.
Return ONLY valid JSON, no markdown or explanation.

IMPORTANT: gapsToAddress, strengthsToHighlight, and generalTips must be arrays of plain strings, NOT objects.

Format:
{
  "overview": "2-3 sentences about the interview process for this role",
  "likelyQuestions": [{ "question": "...", "tipToAnswer": "how to answer given my background" }],
  "strengthsToHighlight": ["plain string describing a strength"],
  "gapsToAddress": ["plain string describing how to frame a gap positively"],
  "generalTips": ["plain string tip"]
}

Include 5 questions, 3 strengths, 2 gap tips, 3 general tips.

My background:
${JSON.stringify(resume).slice(0, 2000)}`,
      }],
    }),
  });

  const raw = data.content?.trim() ?? '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not generate prep tips — try again');
  return JSON.parse(jsonMatch[0]);
}
