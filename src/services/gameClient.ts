import {
    type StartGameMessage,
    type GameMessage,
    type JoinGameMessage,
    type ErorrGameMessage,
    type GameAction,
    type GameActionMessage,
    getGamePeerId
} from "./messages";

import EventEmitter from "eventemitter3"

import type { Player } from "../db/player";
import { P2PConnection, p2pDefaultConfig } from "../p2p/p2p";
import { ObjectSync } from "../p2p/objectSync";
import type Game from "../db/game";
import type { GamePublicState, PlayerPrivateState } from "../db/gameState";
import { SignalErrorType } from "../../server/src/messages";

export enum ConnectStatus {
    CONNECTING,
    CONNECTED,
    DISCONNECTED
}

interface GameClientEvents {
    connectStatusChanged: (status: ConnectStatus) => void

    JoinGameMessage: (message: JoinGameMessage) => void
    ErorrGameMessage: (message: ErorrGameMessage) => void

    gameReceive: (game: Game) => Game
}

export default class GameClient extends EventEmitter<GameClientEvents> {
    private gameId: string;
    private userId: string;
    gameObjectSync: ObjectSync<Game>
    gamePublicStateSync: ObjectSync<GamePublicState>
    playerPrivateStateSync: ObjectSync<PlayerPrivateState>
    connection!: P2PConnection
    connectStatus: ConnectStatus = ConnectStatus.CONNECTING

    async start() {
        await this.connection.start()
        this.connection?.connectTo(getGamePeerId(this.gameId))
    }

    constructor(gameId: string, userId: string) {
        super();
        this.gameId = gameId
        this.userId = userId
        this.connection = new P2PConnection(this.userId, p2pDefaultConfig)
        this.gameObjectSync = new ObjectSync<Game>({ connection: this.connection, id: 'game' })
        this.gamePublicStateSync = new ObjectSync<GamePublicState>({ connection: this.connection, id: 'gamePublicState' })
        this.playerPrivateStateSync = new ObjectSync<PlayerPrivateState>({ connection: this.connection, id: 'playerPrivateState:' + userId })

        this.connection.on('dataMessage', (_peerId, message) => {
            const gameMessage = JSON.parse(message) as GameMessage
            console.log(`Client message received`, gameMessage)
            this.emit(gameMessage.type as keyof GameClientEvents, gameMessage as any)
        })

        this.connection.on('peerConnected', (peerId) => {
            if (peerId == getGamePeerId(this.gameId)) {
                this.connectStatus = ConnectStatus.CONNECTED
                this.emit('connectStatusChanged', this.connectStatus)
            }
        })

        this.connection.on('peerDisconnected', (peerId) => {
            if (peerId == this.gameId) {
                this.connectStatus = ConnectStatus.DISCONNECTED
                this.emit('connectStatusChanged', this.connectStatus)
            }
        })

        this.connection.on('signalError', (errorType, _message) => {
            switch (errorType) {
                case SignalErrorType.PEER_ALREADY_CONNECTED:
                    this.emit('ErorrGameMessage', {
                        type: 'ErorrGameMessage',
                        message: 'User already conneted to this game'
                    })
                    break;
                case SignalErrorType.NO_PEER:
                    this.emit('ErorrGameMessage', {
                        type: 'ErorrGameMessage',
                        message: `Game "${this.gameId} not hosted"`
                    })
                    break;
            }
        })
    }

    send<T extends GameMessage>(message: T) {
        this.connection.send(this.gameId, JSON.stringify(message))
    }

    join(name: string, color: string) {
        const player: Player = {
            userId: this.userId,
            name: name,
            color: color,
            online: true
        }
        this.send<JoinGameMessage>({
            type: 'JoinGameMessage',
            player: player
        })
    }

    performGameAction(action: GameAction) {
        this.send<GameActionMessage>({
            type: 'GameActionMessage',
            action: action
        })
    }

    startGame() {
        this.send<StartGameMessage>({ type: 'StartGameMessage' })
    }

    updatePlayer(name: string, color: string) {
        const player = this.gameObjectSync.value?.players.find(player => player.userId == this.userId)
        if (player) {
            player.name = name
            player.color = color
            const playerIndex = this.gameObjectSync.value?.players.indexOf(player)
            this.gameObjectSync.sendUpdate(`players[${playerIndex}]`)
        }
    }

    close() {
        this.connection?.close()
    }
}