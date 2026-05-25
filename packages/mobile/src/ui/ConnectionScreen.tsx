import { useState } from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import type { Connection } from "../client/types"
import { colors, spacing } from "./theme"

export function ConnectionScreen(props: { error?: string; onConnect(connection: Connection): void }) {
  const [url, setUrl] = useState("http://localhost:4096")
  const [username, setUsername] = useState("opencode")
  const [password, setPassword] = useState("")

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800" }}>Connect to opencode</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
        Use `opencode serve --hostname 0.0.0.0 --port 4096` on your PC or server.
      </Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" style={inputStyle} placeholder="Server URL" placeholderTextColor={colors.muted} />
      <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={inputStyle} placeholder="Username" placeholderTextColor={colors.muted} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={inputStyle} placeholder="Password" placeholderTextColor={colors.muted} />
      {props.error ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{props.error}</Text> : null}
      <Pressable style={{ marginTop: spacing.lg, backgroundColor: colors.accent, padding: spacing.lg, borderRadius: 12 }} onPress={() => props.onConnect({ url, username, password })}>
        <Text style={{ color: "#001018", textAlign: "center", fontWeight: "800" }}>Connect</Text>
      </Pressable>
    </View>
  )
}

const inputStyle = {
  color: colors.text,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 12,
  padding: spacing.md,
  marginTop: spacing.md,
} as const
