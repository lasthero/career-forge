// Zustand global state — resume, job matches, selected job, interview prep
import { create } from 'zustand';
import { ResumeData, MatchResult, InterviewPrep, JobMatch } from './api';

type Store = {
  resume:        ResumeData | null;
  matchResult:   MatchResult | null;
  interviewPrep: InterviewPrep | null;
  selectedJob:   JobMatch | null;
  isClearing:    boolean;  // ← add this

  setResume:        (data: ResumeData) => void;
  setMatchResult:   (result: MatchResult) => void;
  setInterviewPrep: (prep: InterviewPrep) => void;
  setSelectedJob:   (job: JobMatch) => void;
  clear:            () => void;
  startClearing:    () => void;
};

export const useResumeStore = create<Store>((set) => ({
  resume:        null,
  matchResult:   null,
  interviewPrep: null,
  selectedJob:   null,
  isClearing:    false,

  setResume:        (data)   => set({ resume: data, isClearing: false }),
  setMatchResult:   (result) => set({ matchResult: result }),
  setInterviewPrep: (prep)   => set({ interviewPrep: prep }),
  setSelectedJob:   (job)    => set({ selectedJob: job }),
  clear:            ()       => set({ resume: null, matchResult: null, interviewPrep: null, selectedJob: null }),
  startClearing:    ()       => set({ isClearing: true }),
}));