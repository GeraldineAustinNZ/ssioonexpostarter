import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, AuthProvider } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useEffect, useState } from 'react';

function RootLayoutContent() {
  const [ready, setReady] = useState(false);

  // Defer running framework setup until after hydration
  useEffect(() => {
    const runSetup = async () => {
      try {
        await useFrameworkReady(); // assuming this is a function, not a hook
        setReady(true);
      } catch (e) {
        console.error('Framework not ready:', e);
      }
    };

    runSetup();
  }, []);

  const { loading } = useAuth();

  if (!ready || loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(provider)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}