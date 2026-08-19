import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { gradients } from "./tokens";

/**
 * Full-screen soft gradient backdrop that the frosted <GlassCard>s float on.
 * Glassmorphism only reads if there's something colorful behind the blur —
 * this is that something. Wrap a screen's content in it and give the content
 * a transparent background.
 */
export function ScreenBackground({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={gradients.appBackground as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
