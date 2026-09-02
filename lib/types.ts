export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile?: Profile
}

export type GameType = 'cash' | 'tournament'

export interface Game {
  id: string
  group_id: string | null // null = a personal/solo game not tied to any group
  name: string
  date: string
  game_type: GameType
  status: 'scheduled' | 'active' | 'closed'
  settlement_mode: 'peer_to_peer' | 'central_bank'
  created_by: string
  created_at: string
}

// A row from the `game_participant_totals` view — the read-side shape.
// `total_buyin` is computed (SUM of buyin/rebuy events), never stored.
export interface GameParticipant {
  id: string
  game_id: string
  user_id: string
  cashout_amount: number | null // cents
  total_buyin: number           // cents
  joined_at: string
  profile?: Profile
}

export interface BuyInEvent {
  id: string
  game_id: string
  user_id: string
  type: 'buyin' | 'rebuy' | 'cashout'
  amount: number // cents
  created_at: string
}

export interface EntryFlag {
  id: string
  entry_id: string
  game_id: string
  target_user_id: string
  flagged_by_user_id: string
  note: string | null
  created_at: string
  flagged_by?: Profile
}

// Derived types used by the UI

export interface GameWithParticipants extends Game {
  game_participants: GameParticipant[]
}

export interface PlayerStats {
  games_played: number
  lifetime_net: number  // cents
  biggest_win: number    // cents
  biggest_loss: number   // cents (stored as negative)
}
