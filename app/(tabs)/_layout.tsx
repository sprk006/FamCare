import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { ColorValue, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts, glass, radius, spacing } from "../../src/theme/tokens";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/** Icon with a soft pill highlight behind it when its tab is focused — the
 * active-state cue that a flat icon+label pair alone doesn't give you. */
function TabIcon({
  name,
  color,
  focused,
}: {
  name: IoniconName;
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.sageDeep,
        tabBarInactiveTintColor: colors.faint,
        tabBarShowLabel: true,
        tabBarStyle: [styles.tabBar, { bottom: insets.bottom + spacing.md }],
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundWrap}>
            <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          </View>
        ),
        tabBarLabelStyle: { fontFamily: fonts.monoMed, fontSize: 9.5, letterSpacing: 0.2, marginTop: 1 },
        headerTransparent: true,
        headerBackground: () => (
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        ),
        headerTitleStyle: { fontFamily: fonts.heading, color: colors.ink },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: "Family",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="people" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="stats-chart" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="checkbox" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="refills"
        options={{
          title: "Refills",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="flask" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-circle" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: "transparent",
    borderRadius: radius.xl,
    overflow: "hidden",
    elevation: 8,
    shadowColor: glass.shadow.shadowColor,
    shadowOpacity: glass.shadow.shadowOpacity,
    shadowRadius: glass.shadow.shadowRadius,
    shadowOffset: glass.shadow.shadowOffset,
    height: 64,
    paddingTop: spacing.xs,
  },
  tabBarItem: { paddingTop: 2 },
  tabBarBackgroundWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: glass.fillStrong,
  },
  iconWrap: {
    width: 38,
    height: 26,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(47,158,122,0.18)",
  },
});
