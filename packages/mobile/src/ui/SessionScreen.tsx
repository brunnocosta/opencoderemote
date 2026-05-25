import type { Session } from "@opencode-ai/sdk/client"
import { useEffect, useState } from "react"
import { FlatList, Pressable, Text, TextInput, View } from "react-native"
import type { OpencodeApi, SessionMessage } from "../client/types"
import { colors, spacing } from "./theme"

export function SessionScreen(props: { api: OpencodeApi; sessionID?: string; onSelectSession(sessionID: string): void; onOpenDiff(): void }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [text, setText] = useState("")

  useEffect(() => {
    props.api.listSessions().then(setSessions).catch(() => setSessions([]))
  }, [props.api])

  useEffect(() => {
    if (!props.sessionID) return
    props.api.listMessages(props.sessionID).then(setMessages).catch(() => setMessages([]))
  }, [props.api, props.sessionID])

  async function create() {
    const session = await props.api.createSession()
    setSessions([session, ...sessions])
    props.onSelectSession(session.id)
  }

  async function send() {
    if (!props.sessionID || !text.trim()) return
    await props.api.sendPrompt(props.sessionID, text.trim())
    setText("")
    setMessages(await props.api.listMessages(props.sessionID))
  }

  if (!props.sessionID) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md }}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>Sessions</Text>
          <Pressable onPress={create}>
            <Text style={{ color: colors.accent }}>New</Text>
          </Pressable>
        </View>
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
        <Text style={{ color: colors.text, fontWeight: "800" }}>{props.sessionID}</Text>
        <Pressable onPress={props.onOpenDiff}>
          <Text style={{ color: colors.accent }}>Diff</Text>
        </Pressable>
      </View>
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
