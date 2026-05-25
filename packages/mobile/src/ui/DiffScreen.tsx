import { useEffect, useState } from "react"
import { FlatList, Text, View } from "react-native"
import type { FileDiff } from "@opencode-ai/sdk/client"
import type { OpencodeApi } from "../client/types"
import { colors, spacing } from "./theme"

export function DiffScreen(props: { api: OpencodeApi; sessionID?: string }) {
  const [diffs, setDiffs] = useState<FileDiff[]>([])

  useEffect(() => {
    if (!props.sessionID) return
    props.api.getDiff(props.sessionID).then(setDiffs).catch(() => setDiffs([]))
  }, [props.api, props.sessionID])

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      data={diffs}
      keyExtractor={(item) => item.file}
      renderItem={({ item }) => (
        <View style={{ padding: spacing.md, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>{item.file}</Text>
          <Text style={{ color: colors.muted }}>+{item.additions} -{item.deletions}</Text>
        </View>
      )}
    />
  )
}
