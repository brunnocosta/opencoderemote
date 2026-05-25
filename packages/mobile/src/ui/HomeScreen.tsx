import { Pressable, Text, View } from "react-native"
import type { Connection } from "../client/types"
import { colors, spacing } from "./theme"

export function HomeScreen(props: { connection: Connection; version?: string; onOpenSessions(): void; onOpenFiles(): void }) {
  return (
    <View style={{ flex: 1, padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>opencode</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm }}>{props.connection.url}</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.xs }}>Server {props.version || "connected"}</Text>
      <Pressable style={buttonStyle} onPress={props.onOpenSessions}>
        <Text style={buttonTextStyle}>Sessions</Text>
      </Pressable>
      <Pressable style={buttonStyle} onPress={props.onOpenFiles}>
        <Text style={buttonTextStyle}>Files</Text>
      </Pressable>
    </View>
  )
}

const buttonStyle = {
  marginTop: spacing.lg,
  backgroundColor: colors.panel,
  borderColor: colors.border,
  borderWidth: 1,
  padding: spacing.lg,
  borderRadius: 12,
} as const

const buttonTextStyle = {
  color: colors.text,
  fontWeight: "700",
} as const
