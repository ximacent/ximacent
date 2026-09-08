export type CreateElectionDTO = {
  title: string
  description: string
  electionType: string

  //Foreign fields
  eventId: string
}

export type UpdateElectionDTO = {
  title?: string
  description?: string
  electionType?: string

  //Foreign fields
  eventId?: string
}

export type FilterElectionDTO = {
  title?: string
  description?: string
  electionType?: string

  //Foreign fields
  eventId?: string
}

