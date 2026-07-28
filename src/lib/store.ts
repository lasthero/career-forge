// career-forge/src/lib/store.ts
import { create } from 'zustand';
import { ResumeData, MatchResult, InterviewPrep, JobMatch } from './api';

type Store = {
  resume:        ResumeData | null;
  matchResult:   MatchResult | null;
  interviewPrep: InterviewPrep | null;
  selectedJob:   JobMatch | null;

  setResume:        (data: ResumeData) => void;
  setMatchResult:   (result: MatchResult) => void;
  setInterviewPrep: (prep: InterviewPrep) => void;
  setSelectedJob:   (job: JobMatch) => void;
  clear:            () => void;
};

export const useResumeStore = create<Store>((set) => ({
  resume:        null,
  matchResult:   null,
  interviewPrep: null,
  selectedJob:   null,

  setResume:        (data)   => set({ resume: data }),
  setMatchResult:   (result) => set({ matchResult: result }),
  setInterviewPrep: (prep)   => set({ interviewPrep: prep }),
  setSelectedJob:   (job)    => set({ selectedJob: job }),
  clear:            ()       => set({ resume: null, matchResult: null, interviewPrep: null, selectedJob: null }),
}));