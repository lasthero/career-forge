// career-forge/app/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getStoredResume, clearStoredResume } from '../src/lib/api';
import { useResumeStore } from '../src/lib/store';
import UploadScreen from '../src/screens/UploadScreen';

export default function Index() {
  const router = useRouter();
  const { setResume, resume, isClearing } = useResumeStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // always read fresh from SecureStore on mount
    getStoredResume().then(stored => {
      console.log('[index] SecureStore resume:', stored?.name ?? 'null');
      console.log('[index] isClearing:', isClearing);

      if (isClearing) {
        console.log('[index] clearing in progress — skipping restore');
        setChecked(true);
        return;
      }

      if (stored) {
        setResume(stored);        // sync SecureStore → Zustand
        router.replace('/resume');
      }

      setChecked(true);
    });
  }, []); // empty deps — only runs on mount, always reads SecureStore

  if (!checked) return null; // avoid flash of upload screen

  return <UploadScreen />;
}