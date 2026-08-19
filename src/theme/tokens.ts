/**
 * Design tokens for FamCare.
 *
 * v2 theme: real brand fonts (Baloo 2 / Nunito / JetBrains Mono, loaded in
 * app/_layout.tsx) plus a glassmorphic surface system — a soft gradient app
 * background with translucent, blurred "glass" cards floating on top. Screens
 * should style from these tokens, and use <ScreenBackground> + <GlassCard>
 * (src/theme/) rather than flat opaque panels, so the whole app reads as one
 * layered, depth-y system instead of plain cards on cream.
 */

export const colors = {
  sage: "#2F9E7A", // primary actions, brand mark, "on track"
  sageDeep: "#1E6B54",
  gold: "#F0A83A", // streaks, positive reinforcement, secondary CTA
  goldDeep: "#8A5F22",
  rose: "#F0684A", // "needs attention" — deliberately soft, not alarm-red
  roseDeep: "#A8341C",
  sky: "#3AA0D6", // informational, refill data
  skyDeep: "#1C5C80",
  berry: "#B4519A", // premium moments — Family plan, paywall
  berryDeep: "#7D2F69",

  paper: "#FBF7F0",
  panel2: "#F5F1E7",
  line: "#E6DFCF",
  faint: "#8B9285",
  muted: "#5B6459",
  ink: "#20261F",

  white: "#FFFFFF",
};

/**
 * Glassmorphic surface tokens. Cards are translucent so the gradient
 * background frosts through a BlurView behind them; the hairline top-light
 * border + soft shadow sell the "pane of glass" depth.
 */
export const glass = {
  // Fill painted ON TOP of the BlurView (kept low-alpha so blur shows through).
  fill: "rgba(255, 255, 255, 0.55)",
  fillStrong: "rgba(255, 255, 255, 0.72)",
  fillTinted: "rgba(255, 255, 255, 0.38)",
  border: "rgba(255, 255, 255, 0.65)",
  borderSoft: "rgba(255, 255, 255, 0.4)",
  blurTint: "light" as const,
  blurIntensity: 40,
  shadow: {
    shadowColor: "#2A3A2E",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

/** Gradient stop sets (feed to expo-linear-gradient `colors`). */
export const gradients = {
  // App background — soft, low-sat blend of the brand hues so frosted glass
  // has something colorful to sit on. Kept gentle: warm, not clinical.
  appBackground: ["#EAF4EF", "#F2ECF7", "#FBF3E8", "#E9F3FA"],
  sage: ["#3FB88E", "#1E6B54"],
  gold: ["#F6C15A", "#E0912A"],
  rose: ["#F58466", "#D64A2C"],
  sky: ["#5BB8E6", "#2A7FB0"],
  berry: ["#C86BB0", "#8E3C78"],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

/** Real font family names — registered via useFonts() in app/_layout.tsx. */
export const fonts = {
  display: "Baloo2_800ExtraBold",
  heading: "Baloo2_700Bold",
  headingSemi: "Baloo2_600SemiBold",
  body: "Nunito_400Regular",
  bodyMedium: "Nunito_600SemiBold",
  bodyBold: "Nunito_700Bold",
  bodyExtra: "Nunito_800ExtraBold",
  mono: "JetBrainsMono_700Bold",
  monoMed: "JetBrainsMono_500Medium",
};

export const type = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36 },
  h1: { fontFamily: fonts.heading, fontSize: 23, lineHeight: 29 },
  h2: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
};

/** Status pill colors, built from the tokens above. */
export const status = {
  on_track: { bg: "#E4F3ED", fg: colors.sageDeep },
  needs_attention: { bg: "#FCEAE5", fg: colors.roseDeep },
  refill: { bg: "#E6F3FA", fg: colors.skyDeep },
  family_plan: { bg: "#F5E7F1", fg: colors.berryDeep },
};
