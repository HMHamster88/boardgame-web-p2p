import type Game from "../db/game";
import type { Player } from "../db/player";

export interface GameMessage {
    type: string;
}

export interface GameInfoMessage {
    type: 'GameInfoMessage',
    game: Game
}

export interface NotifyGameMessage extends GameMessage {
    type: 'NotifyGameMessage',
    message: string,
    messageParams?: any
}

export interface ErorrGameMessage extends GameMessage {
    type: 'ErorrGameMessage',
    message: string,
    messageParams?: any
}

export interface StartGameMessage extends GameMessage {
    type: 'StartGameMessage'
}

export interface JoinGameMessage extends GameMessage {
    type: 'JoinGameMessage'
    player: Player
}

export interface KickPlayerMessage extends GameMessage {
    type: 'KickPlayerMessage'
    playerId: string
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

export type MessageTypeOf<T extends TypedMessage> = T['type']

type MessageHandler<T extends TypedMessage> = (message: T) => void

export type MesasgeHandlers<T extends TypedMessage> = {
    [K in Pick<T, 'type'>['type']]: MessageHandler<Extract<T, { type: K }>>
}

export async function handleMessage<T extends TypedMessage>(handlers: MesasgeHandlers<T>, message: TypedMessage): Promise<boolean> {
    const handler = (handlers as any)[message.type]
    if (handler) {
        await handler(message)
        return true
    }
    return false
}

