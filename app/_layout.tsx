import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from "@expo-google-fonts/baloo-2";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";

import { colors } from "../src/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Hold on the native splash until fonts resolve so no screen flashes in the
  // system fallback font first. On a font error we proceed anyway (fallback
  // font) rather than blocking the app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: "Baloo2_700Bold", color: colors.ink },
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: "Scan medication" }} />
        <Stack.Screen name="confirm-medication" options={{ title: "Confirm medication" }} />
        <Stack.Screen name="invite" options={{ title: "Invite caregiver" }} />
        <Stack.Screen name="member/[id]" options={{ title: "Family member" }} />
        <Stack.Screen name="task/new" options={{ title: "Add task" }} />
        <Stack.Screen name="caregiver/new" options={{ title: "Add caregiver" }} />
        <Stack.Screen name="activity" options={{ title: "Family activity" }} />
        <Stack.Screen name="medication/[id]" options={{ title: "Medication" }} />
        <Stack.Screen name="providers" options={{ title: "Care directory" }} />
        <Stack.Screen name="provider/new" options={{ title: "Add to directory" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
