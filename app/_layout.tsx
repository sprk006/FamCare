import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTitleStyle: { fontWeight: "600" } }}>
        <Stack.Screen name="index" options={{ title: "FamCare" }} />
        <Stack.Screen
          name="member/[id]"
          options={{ title: "Family Member" }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
