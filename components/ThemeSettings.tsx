// src/components/ThemeSettings.tsx
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useResolvedTheme } from "../hooks/use-resolved-theme";
import useGoalsStore from "../store/useGoalsStore";

export const ThemeSettings: React.FC = () => {
  const themePref = useGoalsStore((s) => s.settings.theme);
  const setTheme = useGoalsStore((s) => s.setTheme);
  const setAccent = useGoalsStore((s) => s.setAccentColor);
  const { tokens } = useResolvedTheme();

  return (
    <View style={[styles.container, { backgroundColor: tokens.surface }]}>
      <Text style={[styles.title, { color: tokens.text }]}>Tema</Text>

      <View style={styles.row}>
        <Pressable onPress={() => setTheme("light")} style={styles.btn}>
          <Text
            style={{
              color: themePref === "light" ? tokens.primary : tokens.text,
            }}
          >
            Light
          </Text>
        </Pressable>
        <Pressable onPress={() => setTheme("dark")} style={styles.btn}>
          <Text
            style={{
              color: themePref === "dark" ? tokens.primary : tokens.text,
            }}
          >
            Dark
          </Text>
        </Pressable>
        <Pressable onPress={() => setTheme("system")} style={styles.btn}>
          <Text
            style={{
              color: themePref === "system" ? tokens.primary : tokens.text,
            }}
          >
            System
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.title, { color: tokens.text, marginTop: 16 }]}>
        Color de acento
      </Text>
      <View style={[styles.row, { marginTop: 8 }]}>
        <Pressable
          onPress={() => setAccent("#f59e0b")}
          style={styles.colorSwatch}
        >
          <View
            style={{
              backgroundColor: "#f59e0b",
              width: 28,
              height: 28,
              borderRadius: 6,
            }}
          />
        </Pressable>
        <Pressable
          onPress={() => setAccent("#06b6d4")}
          style={styles.colorSwatch}
        >
          <View
            style={{
              backgroundColor: "#06b6d4",
              width: 28,
              height: 28,
              borderRadius: 6,
            }}
          />
        </Pressable>
        <Pressable
          onPress={() => setAccent("#8b5cf6")}
          style={styles.colorSwatch}
        >
          <View
            style={{
              backgroundColor: "#8b5cf6",
              width: 28,
              height: 28,
              borderRadius: 6,
            }}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { padding: 10 },
  colorSwatch: { padding: 6 },
});
