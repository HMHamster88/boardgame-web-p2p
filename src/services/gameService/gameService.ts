import type { Component } from "vue"
import type Game from "../../db/game"
import { type CrateGameProps } from "../../db/game"
import type { GameState } from "../../db/gameState"
import type { GameAction } from "../messages"

export interface GameService {
    createGame(props: CrateGameProps): Game
    startGame(game: Game): GameState
    performAction(game: Game, gameState: GameState, gameAction: GameAction): void
    readonly settingsComponent: Component
    readonly gameViewComponent: Component
}


