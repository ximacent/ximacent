import { EscalationPriority, ReferenceType } from "@/database/entities/Dispute"

export type CreateDisputeDTO = {
  userReason: string
  userComplaint: string
  referenceType: ReferenceType

  eventId: string
  userId: string
}

export type UpdateDisputeDTO = {
  userReason?: string
  complaint?: string
}

export type FilterDisputeDTO = {
  userReason?: string
  referenceType?: ReferenceType
  status?: string
  escalationPriority?: EscalationPriority

  eventId?: string
  userId?: string
  resolvedById?: string
  escalatedById?: string
  assignedToId?: string
}

export type EscalateDisputeDTO = {
  escalationReason: string
  escalationPriority: EscalationPriority

  assignedToId?: string
}

export type RejectDisputeDTO = {
  rejectionReason: string
}

