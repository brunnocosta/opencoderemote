import { SafeAreaView, StatusBar, Text, View } from "react-native"

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f14" }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: "#f8fafc", fontSize: 28, fontWeight: "700" }}>opencode</Text>
        <Text style={{ color: "#94a3b8", marginTop: 8, textAlign: "center" }}>Mobile client scaffold</Text>
      </View>
    </SafeAreaView>
  )
}
