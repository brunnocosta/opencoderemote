import { useEffect, useState } from "react"
import { FlatList, Pressable, ScrollView, Text, View } from "react-native"
import type { FileContent, FileNode } from "@opencode-ai/sdk/client"
import type { OpencodeApi } from "../client/types"
import { colors, spacing } from "./theme"

export function FileScreen(props: { api: OpencodeApi }) {
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [content, setContent] = useState<FileContent | undefined>()

  useEffect(() => {
    props.api.listFiles(".").then(setNodes).catch(() => setNodes([]))
  }, [props.api])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {content ? (
        <ScrollView>
          <Text style={{ color: colors.text, padding: spacing.md, fontFamily: "monospace" }}>{String(content.content || "")}</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item, index) => `${item.path}-${index}`}
          renderItem={({ item }) => (
            <Pressable onPress={() => props.api.readFile(item.path).then(setContent).catch(() => undefined)}>
              <Text style={{ color: colors.text, padding: spacing.md }}>{item.path}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}
