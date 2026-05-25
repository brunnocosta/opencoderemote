import { Pressable, Text, View } from "react-native"
import type { PermissionDecision, PermissionRequest } from "../client/types"
import { colors, spacing } from "./theme"

export function PermissionBanner(props: { request?: PermissionRequest; onRespond(response: PermissionDecision): void }) {
  if (!props.request) return null
  return (
    <View style={{ padding: spacing.md, backgroundColor: colors.panel, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <Text style={{ color: colors.text, fontWeight: "800" }}>{props.request.title}</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.accent }} onPress={() => props.onRespond("once")}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Allow Once</Text>
        </Pressable>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.accent }} onPress={() => props.onRespond("always")}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Always</Text>
        </Pressable>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.danger }} onPress={() => props.onRespond("reject")}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Reject</Text>
        </Pressable>
      </View>
    </View>
  )
}
