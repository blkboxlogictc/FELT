export interface PlayerResult {
  id: string
  name: string
  totalBuyin: number     // cents
  cashoutAmount: number  // cents
  net: number            // cents, positive = won, negative = lost
}

export interface SettlementTransaction {
  from: string   // payer name
  to: string     // payee name
  amount: number // cents
}

export interface PeerToPeerSettlement {
  mode: 'peer_to_peer'
  transactions: SettlementTransaction[]
}

export interface CentralBankSettlement {
  mode: 'central_bank'
  payHost: SettlementTransaction[]   // losers pay the host
  hostPays: SettlementTransaction[]  // host pays winners
}

export type Settlement = PeerToPeerSettlement | CentralBankSettlement

/**
 * Greedy debt-minimization algorithm.
 * Matches largest debtor to largest creditor until all balances clear.
 * Produces the minimum number of transactions needed to settle.
 */
export function calculatePeerToPeer(players: PlayerResult[]): PeerToPeerSettlement {
  const creditors = players
    .filter((p) => p.net > 0)
    .map((p) => ({ name: p.name, remaining: p.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const debtors = players
    .filter((p) => p.net < 0)
    .map((p) => ({ name: p.name, remaining: Math.abs(p.net) }))
    .sort((a, b) => b.remaining - a.remaining)

  const transactions: SettlementTransaction[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].remaining, debtors[di].remaining)

    if (amount > 0) {
      transactions.push({
        from: debtors[di].name,
        to: creditors[ci].name,
        amount,
      })
    }

    creditors[ci].remaining -= amount
    debtors[di].remaining -= amount

    if (creditors[ci].remaining === 0) ci++
    if (debtors[di].remaining === 0) di++
  }

  return { mode: 'peer_to_peer', transactions }
}

/**
 * Central bank mode — host acts as clearing house.
 * Losers pay the host; host pays winners.
 */
export function calculateCentralBank(players: PlayerResult[]): CentralBankSettlement {
  return {
    mode: 'central_bank',
    payHost: players
      .filter((p) => p.net < 0)
      .map((p) => ({ from: p.name, to: 'Host', amount: Math.abs(p.net) }))
      .sort((a, b) => b.amount - a.amount),
    hostPays: players
      .filter((p) => p.net > 0)
      .map((p) => ({ from: 'Host', to: p.name, amount: p.net }))
      .sort((a, b) => b.amount - a.amount),
  }
}

/** Run the appropriate algorithm for the session's settlement mode */
export function calculateSettlement(
  players: PlayerResult[],
  mode: 'peer_to_peer' | 'central_bank'
): Settlement {
  return mode === 'peer_to_peer'
    ? calculatePeerToPeer(players)
    : calculateCentralBank(players)
}

/** Build PlayerResult array from game_participant_totals rows */
export function buildPlayerResults(
  participants: Array<{
    user_id: string
    total_buyin: number
    cashout_amount: number | null
    profile: { display_name: string }
  }>
): PlayerResult[] {
  return participants.map((p) => {
    const cashout = p.cashout_amount ?? 0
    return {
      id: p.user_id,
      name: p.profile.display_name,
      totalBuyin: p.total_buyin,
      cashoutAmount: cashout,
      net: cashout - p.total_buyin,
    }
  })
}
