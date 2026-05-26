import { Pressable, Text, View } from "react-native"
import { mapPermissionButtonToReply } from "@opencode-ai/app-core/workflow/permission"
import type { PermissionReply, PermissionRequest } from "../client/types"
import { colors, spacing } from "./theme"

export function PermissionBanner(props: { request?: PermissionRequest; onRespond(response: PermissionReply): void }) {
  if (!props.request) return null
  return (
    <View style={{ padding: spacing.md, backgroundColor: colors.panel, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <Text style={{ color: colors.text, fontWeight: "800" }}>{props.request.title}</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.accent }} onPress={() => props.onRespond(mapPermissionButtonToReply("allow"))}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Allow Once</Text>
        </Pressable>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.accent }} onPress={() => props.onRespond(mapPermissionButtonToReply("always"))}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Always</Text>
        </Pressable>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.danger }} onPress={() => props.onRespond(mapPermissionButtonToReply("deny"))}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Reject</Text>
        </Pressable>
      </View>
    </View>
  )
}
