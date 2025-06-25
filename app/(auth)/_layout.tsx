import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" options={{}} />
      <Stack.Screen name="sign-up" options={{}} />
      <Stack.Screen name="onboarding" options={{}} />
    </Stack>
  );
}