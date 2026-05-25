import { useState } from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import type { Connection } from "../client/types"
import { getConnectionValidation } from "./connection-validation"
import { colors, spacing } from "./theme"

export function ConnectionScreen(props: { error?: string; connecting?: boolean; onConnect(connection: Connection): void }) {
  const [url, setUrl] = useState("")
  const [username, setUsername] = useState("opencode")
  const [password, setPassword] = useState("")
  const [trustedLocal, setTrustedLocal] = useState(false)
  const validation = getConnectionValidation({ url, password, trustedLocal })

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800" }}>Connect to opencode</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
        Use `opencode serve --hostname 0.0.0.0 --port 4096` on your PC or server, then enter your computer LAN address.
      </Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" style={inputStyle} placeholder="http://192.168.1.23:4096" placeholderTextColor={colors.muted} />
      <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={inputStyle} placeholder="Username" placeholderTextColor={colors.muted} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={inputStyle} placeholder="Password" placeholderTextColor={colors.muted} />
      <Pressable onPress={() => setTrustedLocal(!trustedLocal)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md }}>
        <Text style={{ color: colors.text }}>{trustedLocal ? "[x]" : "[ ]"}</Text>
        <Text style={{ color: colors.muted }}>Trust local server without password</Text>
      </Pressable>
      {validation ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{validation}</Text> : null}
      {props.error ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{props.error}</Text> : null}
      <Pressable
        disabled={props.connecting || Boolean(validation)}
        style={{ marginTop: spacing.lg, backgroundColor: props.connecting || validation ? colors.border : colors.accent, padding: spacing.lg, borderRadius: 12 }}
        onPress={() => props.onConnect({ url: url.trim(), username, password, trustedLocal })}
      >
        <Text style={{ color: "#001018", textAlign: "center", fontWeight: "800" }}>{props.connecting ? "Connecting..." : "Connect"}</Text>
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
