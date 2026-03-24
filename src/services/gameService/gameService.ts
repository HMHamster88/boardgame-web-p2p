import type { Component } from "vue"
import type Game from "../../db/game"
import { type CrateGameProps } from "../../db/game"
import type { GamePublicState, GameState, PlayerPrivateState } from "../../db/gameState"
import type { GameAction } from "../messages"
import { ObjectSync } from "../../p2p/objectSync"

export interface GameObjectSyncs {
    gameSync?: ObjectSync<Game>
    gamePublicStateSync?: ObjectSync<GamePublicState>
    playerPrivateStateSync: Map<string, ObjectSync<PlayerPrivateState>>
}

export interface GameService {
    createGame(props: CrateGameProps): Game
    startGame(game: Game): GameState
    performAction(game: Game, gameState: GameState, gameAction: GameAction, playerId: string, syncs: GameObjectSyncs): Promise<void>
    readonly settingsComponent: Component
    readonly gameViewComponent: Component
    readonly gameType: string
    readonly gameName: string
    readonly localization: any
}


