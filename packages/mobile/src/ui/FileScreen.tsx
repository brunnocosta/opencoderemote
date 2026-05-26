import type { FileContent, FileNode } from "@opencode-ai/sdk/client"
import { getParentPath, isDirectoryNode } from "@opencode-ai/app-core/workflow/file"
import { useEffect, useState } from "react"
import { FlatList, Pressable, ScrollView, Text, View } from "react-native"
import type { OpencodeApi } from "../client/types"
import { colors, spacing } from "./theme"

export function FileScreen(props: { api: OpencodeApi; onBack(): void }) {
  const [path, setPath] = useState(".")
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [content, setContent] = useState<FileContent | undefined>()
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    setContent(undefined)
    setError(undefined)
    props.api.listFiles(path).then(setNodes).catch((error) => {
      setNodes([])
      setError(error instanceof Error ? error.message : String(error))
    })
  }, [props.api, path])

  async function open(node: FileNode) {
    setError(undefined)
    if (isDirectoryNode(node)) {
      setPath(node.path)
      return
    }
    try {
      setContent(await props.api.readFile(node.path))
    } catch (fileError) {
      try {
        setNodes(await props.api.listFiles(node.path))
        setPath(node.path)
      } catch {
        setError(fileError instanceof Error ? fileError.message : String(fileError))
      }
    }
  }

  function back() {
    if (content) {
      setContent(undefined)
      return
    }
    if (path !== ".") {
      setPath(getParentPath(path))
      return
    }
    props.onBack()
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md }}>
        <Pressable onPress={back}>
          <Text style={{ color: colors.accent }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "800" }}>{content ? "File" : path}</Text>
      </View>
      {error ? <Text style={{ color: colors.danger, paddingHorizontal: spacing.md }}>{error}</Text> : null}
      {content ? (
        <ScrollView>
          <Text style={{ color: colors.text, padding: spacing.md, fontFamily: "monospace" }}>{String(content.content || "")}</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item, index) => `${item.path}-${index}`}
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item)}>
              <Text style={{ color: colors.text, padding: spacing.md }}>{isDirectoryNode(item) ? "[dir] " : ""}{item.path}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}
