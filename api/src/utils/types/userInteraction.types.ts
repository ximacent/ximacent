import { FollowStatus, InteractionType, LikeStatus, ReactionType, TargetType } from "@/database/entities/UserInteraction"

export type CreateUserInteractionDTO = {
  type: InteractionType
  reactionType?: ReactionType
  content?: string
  targetType: TargetType
  targetId: string
}

export type FilterUserInteractionDTO = {
  type?: InteractionType
  likeStatus?: LikeStatus
  followStatus?: FollowStatus
  reactionType?: ReactionType
  targetType?: TargetType
  targetId?: string
  userId?: string
}