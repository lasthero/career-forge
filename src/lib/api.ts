// career-forge/src/lib/api.ts
// API client — all server calls, device storage, session management
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY!;

// ── Robust JSON extraction ────────────────────────────────────────────────────
// Bedrock output can include stray text/markdown around the JSON, or occasionally
// truncate mid-structure. A naive greedy regex (first { to last }) can grab the
// wrong span if there's any extra content. This walks brace-by-brace from the
// first { to find its true matching close, then validates it actually parses.
function extractJson<T>(raw: string): T {
  const text = raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');

  const braceStart   = text.indexOf('{');
  const bracketStart = text.indexOf('[');

  // If a top-level array appears before (or instead of) any object, the model
  // wrapped its output wrong (or got truncated into just one array item).
  // Our schemas are always top-level objects, so grabbing the first { inside
  // an array would silently return a single fragment instead of the full shape.
  if (bracketStart !== -1 && (braceStart === -1 || bracketStart < braceStart)) {
    console.error('[extractJson] response is array-wrapped, expected an object:', text.slice(0, 300));
    throw new Error('AI response had the wrong shape — please try again');
  }

  if (braceStart === -1) {
    console.error('[extractJson] no { found in response:', text.slice(0, 300));
    throw new Error('AI response did not contain any JSON — please try again');
  }

  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') depth--;
    if (depth === 0) { end = i; break; }
  }

  if (end === -1) {
    console.error('[extractJson] unbalanced braces — likely truncated response:', text.slice(0, 500));
    throw new Error('AI response was cut off before finishing — please try again');
  }

  const candidate = text.slice(braceStart, end + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (err) {
    console.error('[extractJson] JSON.parse failed on:', candidate.slice(0, 500));
    throw new Error('Could not understand the AI response — please try again');
  }

  if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
    console.error('[extractJson] parsed result is not an object:', candidate.slice(0, 300));
    throw new Error('AI response had the wrong shape — please try again');
  }

  return parsed as T;
}

// ── Device ID ─────────────────────────────────────────────────────────────────
export async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
    deviceId = Device.modelId ?? Crypto.randomUUID();
    await SecureStore.setItemAsync('deviceId', deviceId);
  }
  return deviceId;
}

// ── Local resume storage ──────────────────────────────────────────────────────
export async function getStoredResume(): Promise<ResumeData | null> {
  const stored = await SecureStore.getItemAsync('resumeData');
  return stored ? JSON.parse(stored) : null;
}

export async function storeResume(resume: ResumeData): Promise<void> {
  await SecureStore.setItemAsync('resumeData', JSON.stringify(resume));
}

export async function clearStoredResume(): Promise<void> {
  await SecureStore.deleteItemAsync('resumeData');
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type ResumeData = {
  name:    string;
  alias:   string | null;
  title:   string;
  industry: string | null; // e.g. "Healthcare", "Software Engineering", "Education", "Sales"
  contact: { email: string; linkedin: string; website: string | null; portfolioUrl: string | null };
  skills:  Record<string, string[]>;
  experience: { title: string; company: string; period: string; bullets: string[] }[];
  education:  { degree: string; institution: string; year: string | null }[];
  additional:      string[];
  credentials:     { name: string; issuer: string | null; year: string | null }[]; // certifications, licenses, bar admissions, etc.
  achievements:    string[]; // quota attainment, publications, awards — anything quantifiable
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
    throw new Error(err.error ?? `API error ${res.status}`);
  }

  return res.json();
}

// ── 1. Parse resume — PDF text extracted server-side, never sent as raw binary ─
export async function parseResume(fileUri: string): Promise<ResumeData> {
  const file = new File(fileUri);
  const base64 = await file.base64();

  console.log('[parseResume] base64 length:', base64.length);

  // server extracts text with pdf2json, then parses with Bedrock —
  // sending raw PDF binary to an LLM produces garbage/hallucinated results
  const data = await apiFetch('/resume/parse-pdf', {
    method: 'POST',
    body: JSON.stringify({ pdfBase64: base64 }),
  });

  const resume = data.resume as ResumeData;
  console.log('[parseResume] parsed name:', resume.name, '| industry:', resume.industry);

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
      resumeText: JSON.stringify(resume), // server uses this as the system-prompt context
      messages: [{
        role: 'user',
        content: `Give me interview prep tips for ${jobTitle} at ${company}.
Return ONLY valid JSON, no markdown or explanation.

Format:
{
  "overview": "2-3 sentences about the interview process for this role",
  "likelyQuestions": [{ "question": "...", "tipToAnswer": "how to answer given my background" }],
  "strengthsToHighlight": ["specific strength from my experience"],
  "gapsToAddress": ["how to frame this gap positively"],
  "generalTips": ["actionable tip specific to this company/role"]
}

Include 5 questions, 3 strengths, 2 gap tips, 3 general tips.`,
      }],
    }),
  });

  return extractJson<InterviewPrep>(data.content ?? '');
}