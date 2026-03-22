import db from "../db/db";
import type Game from "../db/game";
import { GameStatusEnum } from "../db/game";
import type { GamePublicState, GameState, PlayerPrivateState } from "../db/gameState";
import { ObjectSync } from "../p2p/objectSync";
import { P2PConnection, p2pDefaultConfig } from "../p2p/p2p";
import { removeElement } from "../utils/arrayUtils";
import type { GameService } from "./gameService/gameService";
import getGameSerivce from "./gameService/gameServiceSelector";
import { getGamePeerId, isGameObserverId, isNotGameObserverId, type ErorrGameMessage, type GameActionMessage, type GameInfoMessage, type GameMessage, type JoinGameMessage, type KickPlayerMessage, type StartGameMessage } from "./messages";

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
        this.connection = new P2PConnection(getGamePeerId(this.gameId), p2pDefaultConfig)
        await this.connection.start()

        this.gameSync = new ObjectSync({
            connection: this.connection,
            id: 'game',
            value: this.game,
            retranslateChanges: true,
            peerFiler: isNotGameObserverId
        })
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

        const settings = this.game.settings

        const messageHandlers = {
            onJoinGameMessage: (peerId: string, message: JoinGameMessage) => {
                if (this.game.players.length >= this.game.settings.maxPlayers) {
                    this.send<ErorrGameMessage>(peerId, { type: 'ErorrGameMessage', message: 'maxPlayerCount', messageParams: { playersCount: settings.maxPlayers } })
                }
                this.game.players.push(message.player)
                db.updateGame(this.game)
                this.sendToAll(message)
            },
            onStartGameMessage: (peerId: string, _message: StartGameMessage) => {
                const playersCount = this.game.players.length

                if (playersCount < settings.minPlayers) {
                    this.send<ErorrGameMessage>(peerId, { type: 'ErorrGameMessage', message: 'minimalPlayerCount', messageParams: { playersCount: settings.minPlayers } })
                    return
                }
                if (playersCount > settings.maxPlayers) {
                    this.send<ErorrGameMessage>(peerId, { type: 'ErorrGameMessage', message: 'maxPlayerCount', messageParams: { playersCount: settings.maxPlayers } })
                    return
                }
                if (peerId != this.game.owner) {
                    this.send<ErorrGameMessage>(peerId, { type: 'ErorrGameMessage', message: 'notGameOwner' })
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
                this.gameSync.updateSended = false
                if (this.gamePublicStateSync) {
                    this.gamePublicStateSync.updateSended = false
                }
                this.playerPrivateStateSync.forEach(sync => sync.updateSended = false)
                this.gameService.performAction(this.game, this.gameState, message.action, peerId,
                    {
                        gameSync: this.gameSync,
                        gamePublicStateSync: this.gamePublicStateSync,
                        playerPrivateStateSync: this.playerPrivateStateSync
                    })

                if (this.gameSync.updateSended) {
                    db.updateGame(this.game)
                }
                if (this.gameState) {
                    const playersUpdated = !Array.from(this.playerPrivateStateSync.values()).find(sync => sync.updateSended)
                    if (playersUpdated || (this.gamePublicStateSync && this.gamePublicStateSync.updateSended)) {
                        db.updateGameState(this.gameState)
                    }
                }
            },
            onKickPlayerMessage: (peerId: string, message: KickPlayerMessage) => {
                const player = this.game.players.find(pl => pl.userId == message.playerId)
                if (!player) {
                    console.debug(`No player with id "${message.playerId}"`)
                    return
                }
                if (this.game.owner != peerId && player.userId == peerId) {
                    console.debug(`Kick player "${message.playerId}" not allowed`)
                    return
                }
                removeElement(this.game.players, player)
                db.updateGame(this.game)
                this.gameSync.sendUpdate('players')
            }
        }

        this.connection.on('dataMessage', (peerId, message) => {
            const gameMessage = JSON.parse(message) as GameMessage
            console.debug('Host message received', gameMessage)

            const handler = (messageHandlers as any)['on' + gameMessage.type]
            if (!handler) {
                return
            }
            handler(peerId, gameMessage)
        })
        this.connection.on('peerConnected', (peerId) => {
            console.debug(`User "${peerId} connected"`)
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

            if (isGameObserverId(peerId)) {
                this.send<GameInfoMessage>(peerId, {
                    type: 'GameInfoMessage',
                    game: this.game
                })
            }
        })

        this.connection.on('peerDisconnected', (peerId) => {
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
        const playerStateSync = new ObjectSync<PlayerPrivateState>({
            connection: this.connection,
            id: 'playerPrivateState:' + userId,
            value: playerState,
            peerFiler: isNotGameObserverId
        })
        this.playerPrivateStateSync.set(userId, playerStateSync)
        return playerStateSync
    }

    createPublicStateSync() {
        this.gamePublicStateSync = new ObjectSync({
            connection: this.connection,
            id: 'gamePublicState',
            retranslateChanges: true,
            value: this.gameState.publicState,
            peerFiler: isNotGameObserverId
        })
    }

    getPlayerById(userId: string) {
        return this.game.players.find(player => player.userId == userId)
    }

    send<T extends GameMessage>(peerId: string, message: T) {
        this.connection.send(peerId, JSON.stringify(message))
    }

    sendToAll<T extends GameMessage>(message: T) {
        this.connection.sendToAll(JSON.stringify(message), (peerConnetion) => {
            return !isGameObserverId(peerConnetion)
        })
    }

    close() {
        if (this.connection) {
            this.connection.close()
        }
    }
}