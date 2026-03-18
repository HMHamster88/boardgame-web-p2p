import db from "../db/db";
import type Game from "../db/game";
import { GameStatusEnum } from "../db/game";
import type { GamePublicState, GameState, PlayerPrivateState } from "../db/gameState";
import { ObjectSync } from "../p2p/objectSync";
import { P2PConnection, p2pDefaultConfig } from "../p2p/p2p";
import type { GameService } from "./gameService/gameService";
import getGameSerivce from "./gameService/gameServiceSelector";
import type { ErorrGameMessage, GameActionMessage, GameMessage, JoinGameMessage, StartGameMessage } from "./messages";

export default class GameHost {
    gameId: string
    game!: Game
    gameState!: GameState
    connection!: P2PConnection
    gameSync!: ObjectSync<Game>
    gamePublicStateSync!: ObjectSync<GamePublicState>
    playerPrivateStateSync: Map<string, ObjectSync<PlayerPrivateState>> = new Map()
    gameService!: GameService

    constructor(gameId: string) {
        this.gameId = gameId
    }

    async start() {
        const dbGame = await db.getGame(this.gameId)
        if (!dbGame) {
            return
        }
        this.game = dbGame
        this.gameService = getGameSerivce(this.game.type)
        this.connection = new P2PConnection(this.gameId, 'gameboard', p2pDefaultConfig)
        await this.connection.start()

        this.gameSync = new ObjectSync(this.connection, 'game', true, this.game, null)
        if (this.game.status != GameStatusEnum.CREATED) {
            const dbGameState = await db.getGameState(this.gameId)
            if (dbGameState) {
                this.gameState = dbGameState
                this.createPublicStateSync()
                this.gameState.privateState?.playersStates?.map(player => player.playerId).forEach(id => {
                    this.createPlayerPrivateStateSync(id)
                })
            }
        }

        const messageHandlers = {
            onJoinGameMessage: (peerId: string, message: JoinGameMessage) => {
                if (this.game.players.length >= this.game.settings.maxPlayers) {
                    this.send<ErorrGameMessage>(peerId, { type: 'ErorrGameMessage', message: 'Maximum players in game' })
                }
                this.game.players.push(message.player)
                db.updateGame(this.game)
                this.sendToAll(message)
            },
            onStartGameMessage: (peerId: string, _message: StartGameMessage) => {
                const playersCount = this.game.players.length
                if (playersCount < this.game.settings.minPlayers || playersCount > this.game.settings.maxPlayers) {
                    this.send<ErorrGameMessage>(peerId, { type: 'ErorrGameMessage', message: 'Invalid players count' })
                    return
                }
                if (peerId != this.game.owner) {
                    this.send<ErorrGameMessage>(peerId, { type: 'ErorrGameMessage', message: 'You are not owner of this game' })
                    return
                }
                this.gameState = this.gameService.startGame(this.game)
                this.createPublicStateSync()
                db.updateGameState(this.gameState)
                db.updateGame(this.game)
                this.gameSync.sendUpdate('status')
                this.gamePublicStateSync.sendUpdate()
                this.game.players.map(player => player.userId).forEach(id => {
                    this.createPlayerPrivateStateSync(id)
                })
                this.playerPrivateStateSync.forEach((sync, peerId) => {
                    sync.sendUpdate(null, peerId)
                })
            },
            onGameActionMessage: (peerId: string, message: GameActionMessage) => {
                this.gameService.performAction(this.game, this.gameState, message.action, peerId)
                db.updateGameState(this.gameState)
                this.gamePublicStateSync.sendUpdate()
                this.playerPrivateStateSync.get(peerId)?.sendUpdate(null, peerId)
                if (this.game.status == GameStatusEnum.FINISHED) {
                    this.gameSync.sendUpdate('status')
                    db.updateGame(this.game)
                }
            }
        }

        this.connection.on('dataMessage', (peerId, message) => {
            const gameMessage = JSON.parse(message) as GameMessage
            console.log('Host message received', gameMessage)

            const handler = (messageHandlers as any)['on' + gameMessage.type]
            if (!handler) {
                console.log(`Invalid message type "${gameMessage.type}"`)
                return
            }
            handler(peerId, gameMessage)
        })
        this.connection.on('peerConnected', (peerId) => {
            console.log(`User "${peerId} connected"`)
            const player = this.getPlayerById(peerId)
            if (player) {
                player.online = true
            }

            this.gameSync.sendUpdate(null, peerId)
            if (this.gamePublicStateSync) {
                this.gamePublicStateSync.sendUpdate(null, peerId)
            }

            if (player) {
                const playerIndex = this.game.players.indexOf(player)
                this.gameSync.sendUpdate(`players[${playerIndex}].online`)
            }

            const playerSync = this.playerPrivateStateSync.get(peerId)
            if (playerSync) {
                playerSync?.sendUpdate(null, peerId)
            }
        })

        this.connection.on('peerDisconnected', (peerId) => {
            console.log("Host peer disconnected ", peerId)
            const player = this.getPlayerById(peerId)
            if (player) {
                player.online = false
                const playerIndex = this.game.players.indexOf(player)
                this.gameSync.sendUpdate(`players[${playerIndex}].online`)
            }
        })
    }

    createPlayerPrivateStateSync(userId: string): ObjectSync<PlayerPrivateState> | null {
        if (this.playerPrivateStateSync.has(userId)) {
            return null
        }
        const playerState = this.gameState.privateState?.playersStates?.find(st => st.playerId == userId)
        if (!playerState) {
            return null
        }
        const playerStateSync = new ObjectSync<PlayerPrivateState>(this.connection, 'playerPrivateState:' + userId, false, playerState)
        this.playerPrivateStateSync.set(userId, playerStateSync)
        return playerStateSync
    }

    createPublicStateSync() {
        this.gamePublicStateSync = new ObjectSync(this.connection, 'gamePublicState', true, this.gameState.publicState, null)
    }

    getPlayerById(userId: string) {
        return this.game.players.find(player => player.userId == userId)
    }

    send<T extends GameMessage>(peerId: string, message: T) {
        this.connection.send(peerId, JSON.stringify(message))
    }

    sendToAll<T extends GameMessage>(message: T) {
        this.connection.sendToAll(JSON.stringify(message))
    }

    close() {
        if (this.connection) {
            this.connection.close()
        }
    }
}