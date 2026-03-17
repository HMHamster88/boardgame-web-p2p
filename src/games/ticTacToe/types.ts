import type { GameSettings } from "../../db/game";
import type { GamePublicState } from "../../db/gameState";
import type { GameAction } from "../../services/messages";

export interface TicTacToeGameSettings extends GameSettings {
    fieldSize: number;
}

export enum TicTacToeGameStateFieldEnum {
    NONE = "NONE",
    CROSS = "CROSS",
    ZERO = "ZERO",
}

export interface TicTacToeGamePublicState extends GamePublicState {
    field: TicTacToeGameStateFieldEnum[][];
}

export interface TicTacToeSetCellAction extends GameAction {
    type: 'TicTacToeSetCellAction'
    x: number,
    y: number
}