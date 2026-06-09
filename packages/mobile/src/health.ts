import { buildAuthHeader, type Connection } from "./connection"

export type HealthResult =
  | { ok: true }
  | { ok: false; message: string }

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export async function checkServerHealth(connection: Connection, fetcher: FetchLike = fetch) {
  try {
    const auth = buildAuthHeader(connection)
    const response = await fetcher(`${connection.url}/health`, auth ? { headers: { authorization: auth } } : undefined)
    if (response.ok) return { ok: true } as const
    return { ok: false, message: `Server health check failed: ${response.status} ${response.statusText}` } as const
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) } as const
  }
}
