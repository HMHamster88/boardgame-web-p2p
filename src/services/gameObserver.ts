import EventEmitter from "eventemitter3";
import _ from "lodash";
import { ref } from "vue";
import type Game from "../db/game";
import { P2PConnection, p2pDefaultConfig } from "../p2p/p2p";
import { extractGameIdFromPeerId, getGameObserverId, handleMessage, isGamePeerId, type GameInfoMessage, type GameMessage } from "./messages";

interface GameObserverEvents {
    gameReceived: (game: Game) => void
}

export default class GameObserver extends EventEmitter<GameObserverEvents> {
    connection: P2PConnection
    games = ref<Game[]>([])

    constructor(userId: string) {
        super()

        console.log(this.games)
        this.connection = new P2PConnection(getGameObserverId(userId), p2pDefaultConfig)
        this.connection.on('peerListReceived', (peerList) => {
            peerList.filter(isGamePeerId)
                .forEach(gamePeerId => {
                    this.connection.connectTo(gamePeerId)
                })
        })

        this.connection.on('dataMessage', (_peerId, message) => {
            const gameMessage = JSON.parse(message) as GameMessage
            handleMessage<GameInfoMessage>({
                GameInfoMessage: (message: GameInfoMessage) => {
                    this.games.value.push(message.game)
                }
            }, gameMessage)
        })

        this.connection.on('peerConnected', (peerId) => {
            console.log('Observer peer connected', peerId)
            if (isGamePeerId(peerId) && !this.connection.peers.has(peerId)) {
                this.connection.connectTo(peerId)
            }
        })

        this.connection.on('peerConnectedToChannel', (peerId) => {
            if (isGamePeerId(peerId)) {
                this.connection.connectTo(peerId)
            }
        })

        this.connection.on('peerDisconnected', (peerId) => {
            const gameId = extractGameIdFromPeerId(peerId)
            if (gameId) {
                _.remove(this.games.value, (game) => game.id == gameId)
            }
        })
    }
}