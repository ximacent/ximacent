import { Audience, Channel } from "@/database/entities/Broadcast"

export type CreateBroadcastDTO = {
  subject: string
  message: string
  channel: Channel
  audience: Audience
  
  eventId?: string
}

export type FilterBroadcastDTO = {
  subject?: string
  message?: string
  channel?: Channel
  audience?: Audience
}

