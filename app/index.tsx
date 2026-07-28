// career-forge/app/index.tsx
// Entry point — checks for stored resume on device, redirects to /resume if found
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getStoredResume } from '../src/lib/api';
import { useResumeStore } from '../src/lib/store';
import UploadScreen from '../src/screens/UploadScreen';

export default function Index() {
  const router = useRouter();
  const setResume = useResumeStore(s => s.setResume);

  useEffect(() => {
    getStoredResume().then(resume => {
      if (resume) {
        setResume(resume);
        router.replace('/resume');
      }
    });
  }, []);

  return <UploadScreen />;
}
