import type { Session } from "@opencode-ai/sdk/client"
import { useEffect, useState } from "react"
import { FlatList, Pressable, Text, TextInput, View } from "react-native"
import type { OpencodeApi, SessionMessage } from "../client/types"
import { colors, spacing } from "./theme"

export function SessionScreen(props: { api: OpencodeApi; sessionID?: string; revision?: number; onBack(): void; onClearSession(): void; onSelectSession(sessionID: string): void; onOpenDiff(): void }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [text, setText] = useState("")
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    setError(undefined)
    props.api.listSessions().then(setSessions).catch((error) => {
      setSessions([])
      setError(error instanceof Error ? error.message : String(error))
    })
  }, [props.api, props.revision])

  useEffect(() => {
    if (!props.sessionID) return
    setError(undefined)
    props.api.listMessages(props.sessionID).then(setMessages).catch((error) => {
      setMessages([])
      setError(error instanceof Error ? error.message : String(error))
    })
  }, [props.api, props.sessionID, props.revision])

  async function create() {
    try {
      setError(undefined)
      const session = await props.api.createSession()
      setSessions([session, ...sessions])
      props.onSelectSession(session.id)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  async function send() {
    if (!props.sessionID || !text.trim()) return
    try {
      setError(undefined)
      await props.api.sendPrompt(props.sessionID, text.trim())
      setText("")
      setMessages(await props.api.listMessages(props.sessionID))
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  if (!props.sessionID) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md }}>
          <Pressable onPress={props.onBack}>
            <Text style={{ color: colors.accent }}>Back</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontWeight: "800" }}>Sessions</Text>
          <Pressable onPress={create}>
            <Text style={{ color: colors.accent }}>New</Text>
          </Pressable>
        </View>
        {error ? <Text style={{ color: colors.danger, paddingHorizontal: spacing.md }}>{error}</Text> : null}
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => props.onSelectSession(item.id)}>
              <Text style={{ color: colors.text, padding: spacing.md }}>{item.title || item.id}</Text>
            </Pressable>
          )}
        />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md }}>
        <Pressable onPress={props.onClearSession}>
          <Text style={{ color: colors.accent }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "800" }}>{props.sessionID}</Text>
        <Pressable onPress={props.onOpenDiff}>
          <Text style={{ color: colors.accent }}>Diff</Text>
        </Pressable>
      </View>
      {error ? <Text style={{ color: colors.danger, paddingHorizontal: spacing.md }}>{error}</Text> : null}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.info.id}
        renderItem={({ item }) => <Text style={{ color: colors.text, padding: spacing.md }}>{item.parts.map((part) => part.text).filter(Boolean).join("\n") || item.info.role}</Text>}
      />
      <View style={{ flexDirection: "row", padding: spacing.md, gap: spacing.sm }}>
        <TextInput value={text} onChangeText={setText} style={{ flex: 1, color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: spacing.md }} />
        <Pressable onPress={send} style={{ backgroundColor: colors.accent, padding: spacing.md, borderRadius: 10 }}>
          <Text style={{ fontWeight: "800" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  )
}
