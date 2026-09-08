export type CreateContestantDTO = {
  name: string
  profileImage: string
  description: string
  orderNumber: number

  //Foreign fields
  votingEventId: string
}

export type UpdateContestantDTO = {
  name?: string
  profileImage?: string
  description?: string
  orderNumber?: number

  //Foreign fields
  votingEventId?: string
}

export type FilterContestantDTO = {
  name?: string
  orderNumber?: number

  //Foreign fields
  votingEventId?: string
}

