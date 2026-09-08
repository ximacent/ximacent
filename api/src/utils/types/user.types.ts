import { Gender } from "@/database/entities/User";
import type { MediaInput } from "../../lib/uploadMedia";

export type CreateUserDTO = {
  displayName: string
  fullName: string
  password: string
  phone: string
  email: string
  gender: Gender
  dateOfBirth: Date
  city: string
  gpsAddress: string
  nationalId?: string
  nationalIdImage?: MediaInput      // raw input (File or Base64MediaInput) — used by createWithUser
  nationalIdImageUrl?: string       // resolved URL after upload — set by the service, not the caller

  // Foreign fields
  roleIds?: string[]
  countryId: string
  stateId: string
  localityId: string
}

export type UpdateUserDTO = {
  displayName: string
  fullName: string
  password?: string
  phone?: string
  email?: string
  gender?: Gender
  dateOfBirth?: Date
  city?: string
  // gpsAddress?: string

  // Foreign fields
  roleIds?: string[]
  countryId?: string
  stateId?: string
  localityId?: string
}

export type FilterUserDTO = {
  displayName: string
  fullName: string
  phone?: string
  email?: string
  gender?: Gender
  // dateOfBirth?: Date
  // gpsAddress?: string
  city?: string
  isVerified?: boolean
  kycStatus?: "PENDING" | "VERIFIED" | "REJECTED"
  nationalId?: string

  // Foreign fields
  roleId?: string
  countryId?: string
  stateId?: string
  localityId?: string
}