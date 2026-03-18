import type { GameSettings } from "../../db/game";
import type { GamePrivateState, GamePublicState, PlayerPrivateState, PlayerPublicState } from "../../db/gameState";
import type { GameAction } from "../../services/messages";

export const cahPlayerCardsCount = 10

export interface CahGameSettings extends GameSettings {
    pointsToWin: number;
}

export interface CahPublicPlayerState extends PlayerPublicState {
    points: number | null
}

export enum CahGamePhase {
    PLAYERS_CHOOSE_ANSWERS,
    ACTIVE_PLAYER_CHOOSE_ANSWERS
}

export interface PlayerAnswers {
    playerId: string,
    answersIds: number[]
}

export interface CahGamePublicState extends GamePublicState {
    phase: CahGamePhase
    questionCardId: number
    playersSlectedAswers: PlayerAnswers[]
    playersStates: CahPublicPlayerState[]
}

export interface CahPrivatePlayerState extends PlayerPrivateState {
    onHandAswersIds: number[]
}

export interface CahGamePrivateState extends GamePrivateState {
    playersStates: CahPrivatePlayerState[] | null

    questionDeck: number[]
    answerDeck: number[]

    questionDiscardPile: number[]
    answerDiscardPile: number[]
}

export interface CahSendAnswersAction extends GameAction {
    type: 'CahSendAnswersAction'
    answersIds: number[]
}

export interface CahSelectAnswerAction extends GameAction {
    type: 'CahSelectAnswerAction'
    playerId: string
}