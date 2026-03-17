import type { Component } from "vue";
import { v4 as uuidv4 } from 'uuid'

import { GameStatusEnum, type CrateGameProps } from "../../db/game";
import type Game from "../../db/game";
import type { GameService } from "../../services/gameService/gameService";
import TickTacToeSettings from "./components/TickTacToeSettings.vue"
import TickTacToeGameView from "./components/TickTacToeGameView.vue"
import { TicTacToeGameStateFieldEnum, type TicTacToeGameSettings, type TicTacToeGamePublicState, type TicTacToeSetCellAction } from "./types";
import type { GameState } from "../../db/gameState";
import { inti2DArray } from "../../utils/arrayUtils";

export class TicTacToeGameService implements GameService {
    readonly gameViewComponent: Component = TickTacToeGameView
    readonly settingsComponent: Component = TickTacToeSettings

    createGame(props: CrateGameProps): Game {
        const settings: TicTacToeGameSettings = {
            minPlayers: 2,
            maxPlayers: 2,
            fieldSize: 3
        }
        return {
            id: uuidv4(),
            owner: props.owner,
            name: props.name,
            type: props.type,
            players: [],
            status: GameStatusEnum.CREATED,
            settings: settings,
            created: new Date()
        }
    }

    startGame(game: Game): GameState {
        game.status = GameStatusEnum.STARTED
        const settings = game.settings as TicTacToeGameSettings

        const publicState: TicTacToeGamePublicState = {
            activePlayerIndex: 0,
            field: inti2DArray(settings.fieldSize, settings.fieldSize, TicTacToeGameStateFieldEnum.NONE),
            playersStates: null,
            winnersIds: []
        }

        const gameState: GameState = {
            id: game.id,
            publicState: publicState,
            privateState: null
        }

        return gameState
    }

    performAction(game: Game, gameState: GameState, gameAction: TicTacToeSetCellAction): void {
        if (game.status != GameStatusEnum.STARTED) {
            return
        }
        const state = gameState.publicState as TicTacToeGamePublicState
        state.field[gameAction.y]![gameAction.x] = state.activePlayerIndex == 0 ? TicTacToeGameStateFieldEnum.CROSS : TicTacToeGameStateFieldEnum.ZERO
        gameState.publicState.activePlayerIndex++
        gameState.publicState.activePlayerIndex = gameState.publicState.activePlayerIndex % game.players.length

        const gameResult = this.checkgameFinished(gameState)
        if (gameResult != TicTacToeGameStateFieldEnum.NONE) {
            gameState.publicState.winnersIds = gameResult == TicTacToeGameStateFieldEnum.CROSS ? [game.players[0]?.userId!] : [game.players[1]?.userId!]
            game.status = GameStatusEnum.FINISHED
        }
    }

    checkgameFinished(gameState: GameState): TicTacToeGameStateFieldEnum {
        const state = gameState.publicState as TicTacToeGamePublicState
        const field = state.field
        for (let row of field) {
            const arrayResult = this.checkFieldArray(row)
            if (arrayResult != TicTacToeGameStateFieldEnum.NONE) {
                return arrayResult
            }
        }

        for (let columnIndex = 0; columnIndex < field.length; columnIndex++) {
            const column = field.map(row => row[columnIndex]!)
            const arrayResult = this.checkFieldArray(column)
            if (arrayResult != TicTacToeGameStateFieldEnum.NONE) {
                return arrayResult
            }
        }

        const diagonal1: TicTacToeGameStateFieldEnum[] = []
        const diagonal2: TicTacToeGameStateFieldEnum[] = []
        for (let columnIndex = 0; columnIndex < field.length; columnIndex++) {
            diagonal1.push(field[columnIndex]![columnIndex]!)
            diagonal2.push(field[columnIndex]![field.length - columnIndex - 1]!)
        }

        const diagonal1Result = this.checkFieldArray(diagonal1)
        if (diagonal1Result != TicTacToeGameStateFieldEnum.NONE) {
            return diagonal1Result
        }

        const diagonal2Result = this.checkFieldArray(diagonal2)
        if (diagonal2Result != TicTacToeGameStateFieldEnum.NONE) {
            return diagonal2Result
        }

        return TicTacToeGameStateFieldEnum.NONE
    }

    checkFieldArray(array: TicTacToeGameStateFieldEnum[]): TicTacToeGameStateFieldEnum {
        for (let cell of array) {
            if (cell == TicTacToeGameStateFieldEnum.NONE) {
                return TicTacToeGameStateFieldEnum.NONE
            }
            if (cell != array[0]) {
                return TicTacToeGameStateFieldEnum.NONE
            }
        }
        return array[0]!
    }
}