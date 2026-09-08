// DTOs for Country entity operations
export type CreateCountryDTO = {
  name: string
  isoCode: string
  phoneCode: string
  currencyCode: string
  timezone?: string
}

export type UpdateCountryDTO = {
  name?: string
  isoCode?: string
  phoneCode?: string
  currencyCode?: string
  timezone?: string
}

export type FilterCountryDTO = {
  name?: string
  isoCode?: string
  phoneCode?: string
  currencyCode?: string
}

// DTOs for State entity operations
export type CreateStateDTO = {
  name: string
  code?: string

  // Foreign fields
  countryId: string
}

export type UpdateStateDTO = {
  name?: string
  code?: string

  // Foreign fields
  countryId?: string
}

export type FilterStateDTO = {
  name?: string
  code?: string

  // Foreign fields
  countryId?: string
}
  
// DTOs for Locality entity operations
export type CreateLocalityDTO = {
  name: string
  code?: string
  type?: string

  // Foreign fields
  stateId: string
}

export type UpdateLocalityDTO = {
  name?: string
  code?: string
  type?: string

  // Foreign fields
  stateId?: string
}

export type FilterLocalityDTO = {
  name?: string
  code?: string
  type?: string

  // Foreign fields
  stateId?: string
}