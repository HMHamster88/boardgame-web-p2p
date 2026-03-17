export interface PlayerPublicState {
    playerId: string
}

export interface PlayerPrivateState {
    playerId: string
}

export interface GamePublicState {
    activePlayerIndex: number;
    playersStates: PlayerPublicState[] | null
    winnersIds: string[]
}

export interface GamePrivateState {
    playersStates: PlayerPrivateState[] | null
}

export interface GameState {
    id: string // equals to game id
    publicState: GamePublicState
    privateState: GamePrivateState | null
}