import type Game from "../db/game";
import type { Player } from "../db/player";

export interface GameMessage {
    type: string;
}

export interface GameInfoMessage {
    type: 'GameInfoMessage',
    game: Game
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

export function getGamePeerId(gameId: string) {
    return 'game-' + gameId
}

export function isGamePeerId(peerId: string) {
    return peerId.startsWith('game-')
}

export function extractGameIdFromPeerId(peerId: string) {
    const match = peerId.match(/game-(.*)/)
    if (match && match[1]) {
        return match[1]
    }
    return null
}

export function getGameObserverId(userId: string) {
    return 'observer-' + userId
}

export function isGameObserverId(peerId: string) {
    return peerId.startsWith('observer-')
}

export function isNotGameObserverId(peerId: string) {
    return !isGameObserverId(peerId)
}

export const channelId = 'boardgame'

export interface TypedMessage {
    type: string
}

export function handleMessage(handlers: any, message: TypedMessage) {
    const handler = handlers['on' + message.type]
    if (handler) {
        handler(message)
    }
}
