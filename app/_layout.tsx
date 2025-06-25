import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, AuthProvider } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

function RootLayoutContent() {
  useFrameworkReady();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{}} />
        <Stack.Screen name="(tabs)" options={{}} />
        <Stack.Screen name="(provider)" options={{}} />
        <Stack.Screen name="+not-found" options={{}} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}