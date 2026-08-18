/**
 * Design tokens lifted from design/design_system.html (FamCare Mood Board &
 * Design System). Screens should style from these tokens rather than
 * hard-coding colors/sizes, so the whole app stays one consistent system.
 *
 * Fonts: the design system specifies Baloo 2 (headings) / Nunito (body) /
 * JetBrains Mono (labels). This prototype uses the system font with the
 * matching weights so no font-loading dependency is required yet — swap the
 * `undefined` fontFamily values below for real ones once
 * @expo-google-fonts/baloo-2 and @expo-google-fonts/nunito are wired in via
 * expo-font.
 */

export const colors = {
  sage: "#2F9E7A", // primary actions, brand mark, "on track"
  gold: "#F0A83A", // streaks, positive reinforcement, secondary CTA
  rose: "#F0684A", // "needs attention" — deliberately soft, not alarm-red
  sky: "#3AA0D6", // informational, refill data
  berry: "#B4519A", // premium moments — Family plan, paywall

  paper: "#FBF7F0",
  panel2: "#F5F1E7",
  line: "#E6DFCF",
  faint: "#8B9285",
  muted: "#5B6459",
  ink: "#20261F",

  white: "#FFFFFF",
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
  pill: 999,
};

export const fonts = {
  display: undefined as string | undefined, // Baloo 2, 800
  heading: undefined as string | undefined, // Baloo 2, 700
  body: undefined as string | undefined, // Nunito, 400/600
  mono: undefined as string | undefined, // JetBrains Mono, 700
};

export const type = {
  display: { fontFamily: fonts.display, fontWeight: "800" as const, fontSize: 28, lineHeight: 34 },
  h1: { fontFamily: fonts.heading, fontWeight: "700" as const, fontSize: 22, lineHeight: 28 },
  h2: { fontFamily: fonts.heading, fontWeight: "700" as const, fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: fonts.body, fontWeight: "600" as const, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontWeight: "400" as const, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.body, fontWeight: "600" as const, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.mono, fontWeight: "700" as const, fontSize: 11, lineHeight: 16 },
};

/** Status pill colors, built from the tokens above. */
export const status = {
  on_track: { bg: "#E4F3ED", fg: colors.sage },
  needs_attention: { bg: "#FCEAE5", fg: colors.rose },
  refill: { bg: "#E6F3FA", fg: colors.sky },
  family_plan: { bg: "#F5E7F1", fg: colors.berry },
};
