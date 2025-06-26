import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, AuthProvider } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

function RootLayoutContent() {
  // Call useFrameworkReady at the top level, not inside useEffect
  useFrameworkReady();
  
  const { loading } = useAuth();

  if (loading) {
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