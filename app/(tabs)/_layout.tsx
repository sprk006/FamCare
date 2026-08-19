import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

import { colors, fonts, glass } from "../../src/theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.sageDeep,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
        ),
        tabBarLabelStyle: { fontFamily: fonts.monoMed, fontSize: 10 },
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
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: "Family",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="refills"
        options={{
          title: "Refills",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="flask" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    backgroundColor: glass.fill,
    elevation: 0,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
});
