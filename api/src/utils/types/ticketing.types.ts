import { TicketStatus } from "@/database/entities/Ticket"

// ================= Ticket Type =================
export type CreateTicketTypeDTO = {
  name: string
  price: number
  quantity: number
  maxPerUser?: number | null
  saleStartDate?: Date | null
  saleEndDate?: Date | null

  //Foreign fields
  eventId: string
}

export type UpdateTicketTypeDTO = {
  name?: string
  price?: number
  quantity?: number
  maxPerUser?: number | null
  saleStartDate?: Date | null
  saleEndDate?: Date | null

  //Foreign fields
  eventId?: string
}

export type FilterTicketTypeDTO = {
  name?: string
  price?: number
  quantity?: number
  maxPerUser?: number | null
  saleStartDate?: Date | null
  saleEndDate?: Date | null

  //Foreign fields
  eventId?: string
}


// ================= Ticket =================
export type CreateTicketDTO = {
  //Foreign fields
  ticketTypeId: string
  userId: string
}

export type FilterTicketDTO = {
  status?: TicketStatus
  checkedInAt?: Date
  transferredCount?: number
  issuedAt?: Date

  //Foreign fields
  ticketTypeId?: string
  userId?: string
}