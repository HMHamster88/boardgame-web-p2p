import type { Component } from "vue"
import type Game from "../../db/game"
import { type CrateGameProps } from "../../db/game"
import type { GamePublicState, GameState, PlayerPrivateState } from "../../db/gameState"
import { ObjectSync } from "../../p2p/objectSync"
import type GameHost from "../gameHost"
import type { GameAction } from "../messages"

export interface GameObjectSyncs {
    gameSync?: ObjectSync<Game>
    gamePublicStateSync?: ObjectSync<GamePublicState>
    playerPrivateStateSync: Map<string, ObjectSync<PlayerPrivateState>>
}

export interface GameService {
    createGame(props: CrateGameProps): Game
    startGame(game: Game): GameState
    performAction(game: Game, gameState: GameState, gameAction: GameAction, playerId: string, host: GameHost): Promise<void>
    readonly settingsComponent: Component
    readonly gameViewComponent: Component
    readonly gameType: string
    readonly gameName: string
    readonly localization: any
    readonly automaticSync: boolean
}


