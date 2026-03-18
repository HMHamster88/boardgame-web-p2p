import type { Component } from "vue";
import { v4 as uuidv4 } from 'uuid'
import { GameStatusEnum, type CrateGameProps } from "../../db/game";
import type Game from "../../db/game";
import type { GameState } from "../../db/gameState";
import type { GameService } from "../../services/gameService/gameService";
import type { GameAction } from "../../services/messages";
import CahSettings from "./components/CahSettings.vue";
import CahGameView from "./components/CahGameView.vue";
import { CahGamePhase, cahPlayerCardsCount, type CahGamePrivateState, type CahGamePublicState, type CahGameSettings, type CahPrivatePlayerState, type CahPublicPlayerState, type CahSelectAnswerAction, type CahSendAnswersAction } from "./cahTypes";
import questions from "./texts/questions";
import answers from "./texts/answers";
import { random } from "lodash";
import { getShuffledArray } from "../../utils/arrayUtils";
import _ from "lodash";


export class CahService implements GameService {

    settingsComponent: Component = CahSettings
    gameViewComponent: Component = CahGameView

    createGame(props: CrateGameProps): Game {
        const settings: CahGameSettings = {
            minPlayers: 2,
            maxPlayers: 10,
            pointsToWin: 10
        }
        return {
            id: uuidv4(),
            owner: props.owner,
            name: props.name,
            type: props.type,
            players: [],
            status: GameStatusEnum.CREATED,
            settings: settings,
            created: new Date()
        }
    }
    startGame(game: Game): GameState {
        game.status = GameStatusEnum.STARTED

        let answerDeck = getShuffledArray(Array.from({ length: answers.length }, (_, i) => i))

        const playersStates = game.players.map(player => {
            const playerCards = answerDeck.splice(0, cahPlayerCardsCount)
            const playerState: CahPrivatePlayerState = {
                playerId: player.userId,
                onHandAswersIds: playerCards
            }
            return playerState
        })

        const privateState: CahGamePrivateState = {
            questionDeck: getShuffledArray(Array.from({ length: questions.length }, (_, i) => i)),
            answerDeck: answerDeck,
            playersStates: playersStates,
            questionDiscardPile: [],
            answerDiscardPile: []
        }

        const publicState: CahGamePublicState = {
            phase: CahGamePhase.PLAYERS_CHOOSE_ANSWERS,
            questionCardId: privateState.questionDeck.shift()!,
            playersSlectedAswers: [],
            activePlayerIndex: random(0, game.players.length - 1),
            playersStates: game.players.map(player => {
                return {
                    playerId: player.userId,
                    points: 0
                } as CahPublicPlayerState
            }),
            winnersIds: []
        }

        const gameState: GameState = {
            id: game.id,
            publicState: publicState,
            privateState: privateState
        }

        return gameState
    }

    performAction(game: Game, gameState: GameState, gameAction: GameAction, playerId: string): void {
        const publicState = gameState.publicState as CahGamePublicState
        const privateState = gameState.privateState as CahGamePrivateState
        const activePlayerId = game.players[gameState.publicState.activePlayerIndex]?.userId
        const handlers = {
            onCahSendAnswersAction: (action: CahSendAnswersAction) => {
                if (publicState.phase != CahGamePhase.PLAYERS_CHOOSE_ANSWERS) {
                    return
                }
                if (!privateState.playersStates) {
                    return
                }
                const playerState = privateState.playersStates.find(ps => ps.playerId == playerId)
                if (!playerState) {
                    console.log(`CahSendAnswersAction: Invalid player id "${playerId}"`)
                    return
                }

                // remove cards from hand
                _.pull(playerState.onHandAswersIds, ...action.answersIds)

                publicState.playersSlectedAswers.push({
                    playerId: playerId,
                    answersIds: action.answersIds
                })

                // all players except active selected their answers
                if (publicState.playersSlectedAswers.length >= privateState.playersStates.length - 1) {
                    publicState.playersSlectedAswers = getShuffledArray(publicState.playersSlectedAswers)
                    publicState.phase = CahGamePhase.ACTIVE_PLAYER_CHOOSE_ANSWERS
                }
            },
            onCahSelectAnswerAction: (action: CahSelectAnswerAction) => {
                if (publicState.phase != CahGamePhase.ACTIVE_PLAYER_CHOOSE_ANSWERS) {
                    return
                }
                if (playerId != activePlayerId) {
                    return
                }

                const player = publicState.playersStates.find(player => player.playerId == action.playerId)!
                player.points!++

                const settings = game.settings as CahGameSettings
                if (player.points! >= settings.pointsToWin) {
                    publicState.winnersIds = [player.playerId]
                    game.status = GameStatusEnum.FINISHED
                }

                publicState.playersSlectedAswers.forEach(pa => {
                    privateState.answerDiscardPile.push(...pa.answersIds)

                })

                privateState.playersStates?.forEach(ps => {
                    this.pushFromDeck(privateState.answerDeck, privateState.answerDiscardPile, ps.onHandAswersIds, cahPlayerCardsCount - ps.onHandAswersIds.length)
                })

                privateState.questionDiscardPile.push(publicState.questionCardId)

                if (privateState.questionDeck.length == 0) {
                    privateState.questionDeck = getShuffledArray(privateState.questionDiscardPile)
                }

                publicState.questionCardId = privateState.questionDeck.shift()!

                publicState.playersSlectedAswers = []
                publicState.phase = CahGamePhase.PLAYERS_CHOOSE_ANSWERS
                publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
            }
        }

        const handler = (handlers as any)['on' + gameAction.type]
        if (!handler) {
            console.log(`Invalid action type "${gameAction.type}"`)
            return
        }
        handler(gameAction)
    }

    pushFromDeck(deck: number[], discardPile: number[], pushTo: number[], count: number) {
        if (!count) {
            return
        }
        if (deck.length < count) {
            const addiitonal = count - deck.length
            pushTo.push(...deck)
            deck.push(...getShuffledArray(discardPile))
            pushTo.push(...deck.splice(0, addiitonal))
        } else {
            const slice = deck.splice(0, count)
            pushTo.push(...slice)
        }
    }

}