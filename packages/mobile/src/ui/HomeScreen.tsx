import { Text, View } from "react-native"
import type { Connection } from "../client/types"
import { colors, spacing } from "./theme"

export function HomeScreen(props: { connection: Connection; version?: string }) {
  return (
    <View style={{ flex: 1, padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>opencode</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm }}>{props.connection.url}</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.xs }}>Server {props.version || "connected"}</Text>
      <View style={panelStyle}>
        <Text style={panelTextStyle}>Sessions coming next</Text>
      </View>
      <View style={panelStyle}>
        <Text style={panelTextStyle}>Files coming next</Text>
      </View>
    </View>
  )
}

const panelStyle = {
  marginTop: spacing.lg,
  backgroundColor: colors.panel,
  borderColor: colors.border,
  borderWidth: 1,
  padding: spacing.lg,
  borderRadius: 12,
} as const

const panelTextStyle = {
  color: colors.muted,
  fontWeight: "700",
} as const
