import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTitleStyle: { fontWeight: "600" } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: "Scan medication" }} />
        <Stack.Screen name="confirm-medication" options={{ title: "Confirm medication" }} />
        <Stack.Screen name="invite" options={{ title: "Invite caregiver" }} />
        <Stack.Screen name="member/[id]" options={{ title: "Family member" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
