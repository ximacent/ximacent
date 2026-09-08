import { ApprovalStatus } from "@/database/entities/EventApproval"
import { Restrictions } from "../../app/shared/value-objects/restrictions.value-object"

//DTOs for Event entity operations
export type CreateEventDTO = {
  title: string
  description?: string
  town: string
  venue: string
  startDate: Date
  endDate: Date
  mode?: "PHYSICAL" | "VIRTUAL" | "HYBRID"
  visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE"
  accessType?: "OPEN" | "RESTRICTED" | "INVITED_ONLY"
  restrictions?: Restrictions
  ageRestriction?: number
  dressCode?: string
  termsURL?: string
  isPaid?: boolean
  refundPolicy?: string
  cancelReason?: string

  // Foreign fields
  eventCategoryId: string
  eventTypeId: string
  organizerId: string
  countryId: string
  stateId: string
  localityId: string
}

export type UpdateEventDTO = {
  title?: string
  description?: string
  town?: string
  venue?: string
  startDate?: Date
  endDate?: Date
  mode?: "PHYSICAL" | "VIRTUAL" | "HYBRID"
  visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE"
  accessType?: "OPEN" | "RESTRICTED" | "INVITED_ONLY"
  restrictions?: Restrictions
  ageRestriction?: number
  dressCode?: string
  termsURL?: string
  isPaid?: boolean
  refundPolicy?: string
  cancelReason?: string

  // Foreign fields
  eventCategoryId?: string
  eventTypeId?: string
  organizerId?: string
  countryId?: string
  stateId?: string
  localityId?: string
}

export type FilterEventDTO = {
  title?: string
  alias?: string
  slug?: string
  town?: string
  venue?: string
  mode?: "PHYSICAL" | "VIRTUAL" | "HYBRID"
  visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE"
  accessType?: "OPEN" | "RESTRICTED" | "INVITED_ONLY"
  ageRestriction?: number 
  dressCode?: string
  isPaid?: boolean

  // Foreign fields
  eventCategoryId: string
  eventTypeId: string
  organizerId: string
  countryId: string
  stateId: string
  localityId: string
}

// DTOs for Category entity operations
export type CreateCategoryDTO = {
  name: string
  description?: string
}

export type UpdateCategoryDTO = {
  name?: string
  description?: string
}

export type FilterCategoryDTO = {
  name?: string
}

// DTOs for EventType entity operations
export type CreateEventTypeDTO = {
  name: string
  description?: string

  // Foreign fields
  eventCategoryId: string
}

export type UpdateEventTypeDTO = {
  name?: string
  description?: string

  // Foreign fields
  eventCategoryId?: string
}

export type FilterEventTypeDTO = {
  name?: string

  // Foreign fields
  eventCategoryId?: string
}
  
// DTOs for EventLocation entity operations
export type CreateEventLocationDTO = {
  venueName: string
  address: string
  city: string
  latitude: number
  longitude: number
  capacity?: number
  maps?: string

  // Foreign fields
  eventId: string
  countryId: string
  stateId: string
  localityId: string
}

export type UpdateEventLocationDTO = {
  venueName?: string
  address?: string
  city?: string
  latitude?: number
  longitude?: number
  capacity?: number
  maps?: string

  // Foreign fields
  countryId?: string
  stateId?: string
  localityId?: string
}

export type FilterEventLocationDTO = {
  venueName?: string
  address?: string
  city?: string

  // Foreign fields
  eventId?: string
  countryId?: string
  stateId?: string
  localityId?: string
}


//DTOs for Event Media entity operations
export type CreateEventMediaDTO = {
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT"
  media_url: string
  thumbnail_url?: string
  
  // Foreign fields
  eventId: string
  uploadedById: string
}

export type UpdateEventMediaDTO = {
  mediaType?: "IMAGE" | "VIDEO" | "DOCUMENT"
  media_url?: string
  thumbnail_url?: string
}

export type FilterEventMediaDTO = {
  mediaType?: "IMAGE" | "VIDEO" | "DOCUMENT"
  eventId?: string
  uploadedById?: string
}

//DTOs for Event Approval entity operations
export type EventApprovalDTO = {
  eventId: string
}

export type FilterEventApprovalDTO = {
  status: ApprovalStatus,
  reviewedById: string,
  eventId: string
}