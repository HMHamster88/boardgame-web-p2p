import type { Player } from "../db/player";

export interface GameMessage {
    type: string;
}

export interface ErorrGameMessage extends GameMessage {
    type: 'ErorrGameMessage',
    message: string
}

export interface StartGameMessage extends GameMessage {
    type: 'StartGameMessage'
}

export interface JoinGameMessage extends GameMessage {
    type: 'JoinGameMessage'
    player: Player
}

export interface GameAction {
    type: string
}

export interface GameActionMessage extends GameMessage {
    type: 'GameActionMessage',
    action: GameAction
}
