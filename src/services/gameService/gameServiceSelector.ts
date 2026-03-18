import { GameType } from "../../db/game"
import type { GameService } from "./gameService"
import { TicTacToeGameService } from "../../games/ticTacToe/ticTacToeGameService"
import { CahService } from "../../games/cah/cahService"

const gameServices = new Map<GameType, GameService>([
    [GameType.TIC_TAC_TOE, new TicTacToeGameService()],
    [GameType.CARDS_AGAINST_HUMANITY, new CahService()]
])

function getGameSerivce(gameType: GameType): GameService {
    return gameServices.get(gameType)!
}

export default getGameSerivce
