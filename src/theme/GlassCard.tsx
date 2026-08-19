import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { glass, radius } from "./tokens";

/**
 * A translucent frosted-glass surface: a BlurView frosts whatever gradient/
 * content sits behind it, under a low-alpha white fill, a diagonal sheen
 * (light catching the top-left edge of the "glass"), a hairline top-light
 * border, and a soft shadow (Android elevation) for depth.
 *
 * `style` is applied to the card box itself, so layout props on it —
 * flexDirection, padding, alignItems, margin — lay out the children directly.
 * The blur + fill + sheen sit absolutely behind them. `overflow: hidden`
 * keeps them clipped to the rounded corners (Android elevation shadows
 * still show, since elevation isn't part of the clipped layer).
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
      <LinearGradient
        colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={styles.layer}
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
