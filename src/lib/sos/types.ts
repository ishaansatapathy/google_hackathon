export type SosStage = 'nearest_peers' | 'mesh_hop' | 'emergency_escalated'

export type SosSession = {
  id: string
  createdAt: number
  lat: number | null
  lng: number | null
  message: string
  stage: SosStage
  peersNotified?: number
  hops?: number
}

export type SosTracePhase = 'nearest' | 'mesh_expand'

export type SosTracePayload = {
  type: 'sos_trace'
  phase: SosTracePhase
  session: SosSession
  peerTargets?: { lat: number; lng: number }[]
  ringTargets?: { lat: number; lng: number }[]
}

export type SosSsePayload =
  | { type: 'sos_alert'; session: SosSession }
  | { type: 'sos_update'; session: SosSession }
  | SosTracePayload
