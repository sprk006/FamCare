import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { glass, radius } from "./tokens";

/**
 * A translucent frosted-glass surface: a BlurView frosts whatever gradient/
 * content sits behind it, under a low-alpha white fill, a hairline top-light
 * border, and a soft shadow (Android elevation) for depth.
 *
 * `style` is applied to the card box itself, so layout props on it —
 * flexDirection, padding, alignItems, margin — lay out the children directly.
 * The blur + fill sit absolutely behind them. `overflow: hidden` keeps the
 * blur clipped to the rounded corners (Android elevation shadows still show).
 */
export function GlassCard({
  children,
  style,
  tint = "regular",
  intensity = glass.blurIntensity,
}: {
  children: ReactNode;
  style?: ViewStyle;
  tint?: "regular" | "strong" | "soft";
  intensity?: number;
}) {
  const fill =
    tint === "strong" ? glass.fillStrong : tint === "soft" ? glass.fillTinted : glass.fill;

  return (
    <View style={[styles.base, glass.shadow, style]}>
      <BlurView
        intensity={intensity}
        tint={glass.blurTint}
        style={[styles.layer, { backgroundColor: fill }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: "transparent",
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
