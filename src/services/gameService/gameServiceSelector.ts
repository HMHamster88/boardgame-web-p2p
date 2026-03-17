import { GameType } from "../../db/game"
import type { GameService } from "./gameService"
import { TicTacToeGameService } from "../../games/ticTacToe/ticTacToeGameService"

const gameServices = new Map<GameType, GameService>([
    [GameType.TIC_TAC_TOE, new TicTacToeGameService()]
])

function getGameSerivce(gameType: GameType): GameService {
    return gameServices.get(gameType)!
}

export default getGameSerivce
