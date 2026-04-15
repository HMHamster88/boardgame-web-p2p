import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import type { Component } from "vue";
import type Game from "../../db/game";
import { GameStatusEnum, type CrateGameProps } from "../../db/game";
import type { GameState } from "../../db/gameState";
import type { ObjectSync } from '../../p2p/objectSync';
import type GameHost from '../../services/gameHost';
import type { GameService } from "../../services/gameService/gameService";
import { handleMessage, type GameAction, type MesasgeHandlers } from "../../services/messages";
import { getShuffledArray, randomEnumVal, rangeArray, recordAsArray, recordEntries, removeCopmarableElements, removeElement } from '../../utils/arrayUtils';
import { sleep } from '../../utils/functionUtils';
import { findByCoordsArray, getEdgeNeighborhoodsPositions, getHexEdgesPositions, getHexVerticesPositions, getVertexHexesPositions, isOutEdge } from '../commonTypes/hex-grid/geometry';
import { Vector2D } from '../commonTypes/vector2d';
import CatanGameView from "./components/CatanGameView.vue";
import CatanSettings from "./components/CatanSettings.vue";
import {
    type CatanBuildIntObjectAction,
    type CatanBuildRoadAction,
    type CatanBuyDevelopmentCardAction,
    type CatanDiscardResourceCards,
    type CatanEmbarkAction,
    type CatanEndTurnAction,
    type CatanGenerateFieldAction,
    type CatanMoveRobberAction,
    type CatanRollDicesAction,
    type CatanTradeAction,
    type CatanTradeResponseAction,
    type CatanUseDevelopmentCardAction,
    type CatanUseResourceDevelopmentCardAction,
    type CatanUseResourceTypeDevelopmentCardAction
} from "./types/actions";
import { CatanGameFieldType } from "./types/catanGameFieldType";
import { CatanTerrainHexType } from "./types/catanTerrainHexType";
import {
    CatanBuyItemType,
    CatanDevelopmentCardType,
    CatanDiceValue,
    CatanGamePhase,
    CatanIntersectionObjectType,
    CatanResourceType,
    CatanTradeType,
    developmentCardSaves,
    developmentCardsCount,
    getBuyItems,
    initResources,
    intersectionObjectRoBuyItem,
    type CatanField,
    type CatanGameSettings,
    type CatanHarbour,
    type CatanIntersection,
    type CatanPlayerPrivateState,
    type CatanPlayerPublicState,
    type CatanPrivateGameState,
    type CatanPublicGameState,
    type CatanResources,
    type CatanRoad,
    type CatanTerrainHex
} from "./types/types";
import { checkDeal, getAllResourcesCount, getPlayerPrices, moveAllResourcesByType } from './types/utils';

const embarkRoadsCount = 2

export function getService(): GameService {
    return new CatanGameService()
}

export class CatanGameService implements GameService {
    readonly automaticSync = true

    localization: any = {
        en: {
            CATAN: 'Catan',
            playerAcceptedDeal: "{player} accepted deal",
            playersRejectedDeal: "All players rejected deal"
        },
        ru: {
            CATAN: 'Колонизаторы',
            playerAcceptedDeal: "{player} принял сделку",
            playersRejectedDeal: "Все игроки отклонили сделку"
        }
    }
    gameType: string = 'CATAN'
    gameName: string = 'Catan'

    settingsComponent: Component = CatanSettings
    gameViewComponent: Component = CatanGameView


    createGame(props: CrateGameProps): Game {
        const settings: CatanGameSettings = {
            minPlayers: 2,
            maxPlayers: 10,
            fieldType: CatanGameFieldType.CLASSIC,
            field: this.generateField(CatanGameFieldType.CLASSIC)
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
        const settings = game.settings as CatanGameSettings
        const publicPlayersStates = game.players.map(player => {
            const state: CatanPlayerPublicState = {
                playerId: player.userId,
                points: 0,
                openedDevelopmentCards: []
            }
            return state
        })
        const publicState: CatanPublicGameState = {
            field: settings.field,
            phase: CatanGamePhase.EMBARK_FIRST,
            activePlayerIndex: _.random(0, game.players.length - 1),
            winnersIds: [],
            playersStates: publicPlayersStates,
            dices: {
                redDice: CatanDiceValue.ONE,
                yellowDice: CatanDiceValue.ONE
            },
            playerTradeOffer: undefined
        }
        const privatePlayerStates = game.players.map(player => {
            const state: CatanPlayerPrivateState = {
                playerId: player.userId,
                resources: initResources({}),
                discardCardsCount: 0,
                developmentCards: [],
                freeBuildings: []
            }
            return state
        })

        const developmentCardsDeck = getShuffledArray(Object.values(CatanDevelopmentCardType)
            .flatMap(type => rangeArray(developmentCardsCount[type]).map(_i => type)))

        const privateState: CatanPrivateGameState = {
            playersStates: privatePlayerStates,
            developmentCardsDeck: developmentCardsDeck,
            developmentCardDiscardPile: []
        }

        const gameState: GameState = {
            id: game.id,
            publicState: publicState,
            privateState: privateState
        }

        game.status = GameStatusEnum.STARTED

        return gameState
    }

    async performAction(game: Game, gameState: GameState, gameAction: GameAction, playerId: string, host: GameHost): Promise<void> {
        const settings = game.settings as CatanGameSettings

        const isSettingsAction = await handleMessage<CatanGenerateFieldAction>({
            CatanGenerateFieldAction: () => {
                settings.field = this.generateField(settings.fieldType)
                host.gameSync?.sendUpdateTypedPath(null, tp => tp.settings)
            }
        }, gameAction)

        if (isSettingsAction) {
            return
        }

        const publicState = gameState.publicState as CatanPublicGameState
        const field = publicState.field
        const privateState = gameState.privateState as CatanPrivateGameState
        const activePlayer = game.players[publicState.activePlayerIndex]
        const activePlayerId = activePlayer?.userId
        const privatePlayerState = privateState.playersStates.find(pl => pl.playerId == playerId)!
        const publicPlayerState = publicState.playersStates.find(pl => pl.playerId == playerId)!
        const activePlayerPrivteState = privateState.playersStates[publicState.activePlayerIndex]
        const isActivePlayerAction = playerId == activePlayerId
        const gamePublicStateSync = host.gamePublicStateSync as any as ObjectSync<CatanPublicGameState>

        type catanActionTypes = CatanEmbarkAction |
            CatanRollDicesAction |
            CatanBuildRoadAction |
            CatanBuildIntObjectAction |
            CatanEndTurnAction |
            CatanDiscardResourceCards |
            CatanMoveRobberAction |
            CatanTradeAction |
            CatanTradeResponseAction |
            CatanBuyDevelopmentCardAction |
            CatanUseDevelopmentCardAction

        const handlers: MesasgeHandlers<catanActionTypes> = {
            CatanEmbarkAction: (action: CatanEmbarkAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }

                const settlement: CatanIntersection = {
                    position: action.settlement,
                    intersectionObjects: [
                        {
                            playerId: playerId,
                            type: CatanIntersectionObjectType.SETTLEMENT
                        }
                    ]
                }

                const road: CatanRoad = {
                    playerId: playerId,
                    position: action.road
                }


                field.intersections.push(settlement)
                field.roads.push(road)

                if (publicState.phase == CatanGamePhase.EMBARK_SECOND) {
                    const hexPoitions = getVertexHexesPositions(settlement.position!)
                    const hexes = hexPoitions.map(hexPos => field.hexes.find(hex => Vector2D.equals(hexPos, hex.position))).filter(hex => hex)
                    const resources = hexes.map(hex => hex?.type!)
                        .map(hexType => this.getHexResources(hexType, settlement.intersectionObjects[0]?.type!))
                    resources.forEach(resource => this.addResources(activePlayerPrivteState, resource))
                }

                const roadsCount = field.roads.length

                if (publicState.phase == CatanGamePhase.EMBARK_FIRST) {
                    if (roadsCount >= game.players.length) {
                        publicState.phase = CatanGamePhase.EMBARK_SECOND
                    } else {
                        publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
                    }

                } else if (publicState.phase == CatanGamePhase.EMBARK_SECOND) {
                    publicState.activePlayerIndex--
                    if (publicState.activePlayerIndex < 0) {
                        publicState.activePlayerIndex = game.players.length - 1
                    }
                    if (roadsCount >= game.players.length * embarkRoadsCount) {
                        publicState.phase = CatanGamePhase.THROWING_DICE
                    }
                }
            },
            CatanRollDicesAction: async () => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }

                const dices = publicState.dices

                dices.redDice = 0
                dices.yellowDice = 0
                gamePublicStateSync.sendUpdateTypedPath(null, tp => tp.dices)
                await sleep(1000)

                dices.redDice = _.random(CatanDiceValue.ONE, CatanDiceValue.SIX)
                dices.yellowDice = _.random(CatanDiceValue.ONE, CatanDiceValue.SIX)

                const allDiceValue = (publicState.dices.redDice as number) + (publicState.dices.yellowDice)

                if (allDiceValue == 7) {
                    let anyoneHasResourceExcess = false
                    for (let player of privateState.playersStates) {
                        const allResourcesCount = getAllResourcesCount(player.resources)
                        const maxPlayerResources = this.maxPlayerResources(player)

                        if (allResourcesCount > maxPlayerResources) {
                            const discardCardsCount = Math.ceil(allResourcesCount / 2)
                            player.discardCardsCount = discardCardsCount
                            anyoneHasResourceExcess = true
                        }
                    }
                    if (anyoneHasResourceExcess) {
                        publicState.phase = CatanGamePhase.DISCARD_CARDS_7
                    } else {
                        publicState.phase = CatanGamePhase.MOVE_ROBBER
                    }
                    return
                }

                const hexes = field.hexes.filter(hex => hex.circularNumber == allDiceValue)

                const playersUpdateId: string[] = []

                for (let hex of hexes) {
                    if (Vector2D.equals(hex.position, field.robberPos)) {
                        continue
                    }
                    const intObjects = findByCoordsArray(getHexVerticesPositions(hex.position), field.intersections)
                        .flatMap(int => int.intersectionObjects)
                    intObjects.forEach(intObject => {
                        const resources = this.getHexResources(hex.type, intObject.type)
                        const playerState = privateState.playersStates.find(player => player.playerId == intObject.playerId)!
                        this.addResources(playerState, resources)
                        playersUpdateId.push(playerState.playerId)

                    })
                }

                publicState.phase = CatanGamePhase.PLAYER_TURN
            },
            CatanBuildRoadAction: (action: CatanBuildRoadAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }

                const freeRoad = activePlayerPrivteState.freeBuildings?.find(building => building == CatanBuyItemType.ROAD)
                const resources = freeRoad ? initResources({}) : getBuyItems().find(item => item.type == CatanBuyItemType.ROAD)?.resources!
                if (!this.checkPlayerHasResources(activePlayerPrivteState, resources)) {
                    return
                }

                let road = field.roads.find(road => Vector2D.equals(road.position, action.position))
                if (road) {
                    console.debug(`Road on position ${action.position} already exists`)
                    return
                }
                // TODO CHECK CAN BUILD
                road = {
                    playerId: playerId,
                    position: action.position
                }
                field.roads.push(road)
                if (freeRoad) {
                    removeElement(activePlayerPrivteState.freeBuildings, freeRoad)
                } else {
                    this.removeResources(activePlayerPrivteState, resources)
                }
            },
            CatanBuildIntObjectAction: (action: CatanBuildIntObjectAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }

                const buyItemType = intersectionObjectRoBuyItem(action.objectType)!
                const resources = getBuyItems().find(item => item.type == buyItemType)?.resources!
                if (!this.checkPlayerHasResources(activePlayerPrivteState, resources)) {
                    return
                }

                let int = field.intersections.find(int => Vector2D.equals(int.position, action.position))
                if (!int) {
                    int = {
                        position: action.position,
                        intersectionObjects: []
                    }
                    field.intersections.push(int)
                }
                let intObject = int.intersectionObjects.find(obj => obj.playerId == playerId && obj.type == action.objectType)
                if (intObject) {
                    console.debug(`Intersection object ${action.objectType} already exists at ${action.position}`)
                    return
                }
                if (action.objectType == CatanIntersectionObjectType.CITY) {
                    const settlement = int.intersectionObjects.find(obj => obj.playerId == playerId && obj.type == CatanIntersectionObjectType.SETTLEMENT)
                    if (!settlement) {
                        console.debug(`Cant buld city. No setlement at ${action.position}`)
                        return
                    }
                    settlement.type = CatanIntersectionObjectType.CITY
                } else {
                    intObject = {
                        type: action.objectType,
                        playerId: playerId
                    }
                    int.intersectionObjects.push(intObject)
                }

                this.removeResources(activePlayerPrivteState, resources)
            },
            CatanEndTurnAction: (_action: CatanEndTurnAction) => {
                if (!isActivePlayerAction || !activePlayerPrivteState) {
                    return
                }
                publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
                publicState.phase = CatanGamePhase.THROWING_DICE
            },
            CatanDiscardResourceCards: (action: CatanDiscardResourceCards) => {
                if (privatePlayerState.discardCardsCount != getAllResourcesCount(action.resources)) {
                    console.debug('Invalid card discard count');
                    return;
                }

                this.removeResources(privatePlayerState, action.resources);
                privatePlayerState.discardCardsCount = 0;
                if (privateState.playersStates.every(ps => ps.discardCardsCount == 0)) {
                    publicState.phase = CatanGamePhase.MOVE_ROBBER;
                }
            },
            CatanMoveRobberAction: (action: CatanMoveRobberAction) => {
                field.robberPos = action.position


                if (action.playerToRob) {
                    const playerToRob = privateState.playersStates.find(ps => ps.playerId == action.playerToRob)!
                    if (getAllResourcesCount(playerToRob?.resources) > 0) {
                        const resourceType = randomEnumVal(CatanResourceType)
                        const resourceRob = initResources({
                            [resourceType]: 1
                        })
                        this.removeResources(playerToRob, resourceRob)
                        this.addResources(privatePlayerState, resourceRob)
                    }
                }

                publicState.phase = CatanGamePhase.PLAYER_TURN
            },
            CatanTradeAction: (action: CatanTradeAction) => {
                if (playerId != activePlayerId) {
                    return
                }
                const deal = action.deal
                if (!checkDeal(deal, getPlayerPrices(field, playerId), privatePlayerState.resources)) {
                    console.debug('Invalid deal')
                    return
                }
                if (deal.type == CatanTradeType.BANK) {
                    this.removeResources(privatePlayerState, deal.offered)
                    this.addResources(privatePlayerState, deal.required)
                } else {
                    publicState.playerTradeOffer = {
                        playerId: playerId,
                        offered: deal.offered,
                        required: deal.required,
                        rejectedPlayerIds: []
                    }
                }
            },
            CatanTradeResponseAction: (action: CatanTradeResponseAction) => {
                const tradeOffer = publicState.playerTradeOffer
                if (!tradeOffer) {
                    console.debug('No active offer')
                    return
                }
                if (action.accepted) {
                    const tradePlayerState = privateState.playersStates.find(ps => ps.playerId == tradeOffer.playerId)!
                    this.removeResources(privatePlayerState, tradeOffer.required)
                    this.addResources(privatePlayerState, tradeOffer.offered)

                    this.removeResources(tradePlayerState, tradeOffer.offered)
                    this.addResources(tradePlayerState, tradeOffer.required)
                    publicState.playerTradeOffer = undefined
                    host.sendNotify(tradeOffer.playerId, 'playerAcceptedDeal', { player: game.players.find(pl => pl.userId == playerId)?.name })
                } else {
                    tradeOffer.rejectedPlayerIds.push(playerId)
                    if (tradeOffer.rejectedPlayerIds.length >= game.players.length - 1) {
                        host.sendNotify(tradeOffer.playerId, 'playersRejectedDeal', undefined)
                        publicState.playerTradeOffer = undefined
                    }
                }
            },
            CatanBuyDevelopmentCardAction: (_action: CatanBuyDevelopmentCardAction) => {
                if (privateState.developmentCardsDeck.length == 0) {
                    privateState.developmentCardsDeck = getShuffledArray(privateState.developmentCardDiscardPile)
                }
                privatePlayerState.developmentCards.push(privateState.developmentCardsDeck.pop()!)
                const cost = getBuyItems().find(item => item.type == CatanBuyItemType.DEVELOPMENT_CARD)?.resources!
                this.removeResources(privatePlayerState, cost)
            },
            CatanUseDevelopmentCardAction: (action: CatanUseDevelopmentCardAction) => {
                removeElement(privatePlayerState.developmentCards, action.developmentCard)
                if (developmentCardSaves[action.developmentCard]) {
                    publicPlayerState.openedDevelopmentCards.push(action.developmentCard)
                } else {
                    privateState.developmentCardDiscardPile.push(action.developmentCard)
                }

                switch (action.developmentCard) {
                    case CatanDevelopmentCardType.KNIGNT:
                        publicState.phase = CatanGamePhase.MOVE_ROBBER
                        return
                    case CatanDevelopmentCardType.BUILD_ROADS:
                        privatePlayerState.freeBuildings.push(CatanBuyItemType.ROAD, CatanBuyItemType.ROAD)
                        return
                    case CatanDevelopmentCardType.MONOPOLY:
                        const resourceTypeAction = action as CatanUseResourceTypeDevelopmentCardAction
                        privateState.playersStates.filter(ps => ps.playerId != playerId)
                            .forEach(playerState => {
                                moveAllResourcesByType(privatePlayerState.resources, playerState.resources, resourceTypeAction.resourcesType)
                            })
                        return
                    case CatanDevelopmentCardType.YEAR_OF_PLENTY:
                        const resourceAction = action as CatanUseResourceDevelopmentCardAction
                        this.addResources(privatePlayerState, resourceAction.resources)
                }
            }
        }

        await handleMessage(handlers, gameAction)

    }

    maxPlayerResources(_playerState: CatanPlayerPrivateState) {
        return 7
    }

    checkPlayerHasResources(playerState: CatanPlayerPrivateState, resources: CatanResources): boolean {
        for (let [resourceType, resourceCount] of recordEntries(resources)) {
            let playerResource = playerState.resources[resourceType]
            if (!playerResource) {
                return false
            }
            if (playerResource < resourceCount) {
                return false
            }
        }
        return true
    }

    removeResources(playerState: CatanPlayerPrivateState, resources: CatanResources): boolean {
        if (!this.checkPlayerHasResources(playerState, resources)) {
            return false
        }

        for (let [resourceType, resourceCount] of recordEntries(resources)) {
            playerState.resources[resourceType] -= resourceCount
        }

        return true
    }

    addResources(playerState: CatanPlayerPrivateState, resources: CatanResources) {
        for (let [resourceType, resourceCount] of recordEntries(resources)) {
            playerState.resources[resourceType] += resourceCount
        }
    }

    getHexResources(hex: CatanTerrainHexType, objectType: CatanIntersectionObjectType): CatanResources {
        const mainResource = CatanTerrainHexType.props[hex].mainResource
        if (!mainResource) {
            return initResources({})
        }

        if (objectType == CatanIntersectionObjectType.SETTLEMENT) {
            return initResources({
                [mainResource]: 1
            })
        } else if (objectType == CatanIntersectionObjectType.CITY) {
            return initResources({
                [mainResource]: 2
            })
        }
        return initResources({})
    }

    generateField(fieldType: CatanGameFieldType): CatanField {
        const props = CatanGameFieldType.props[fieldType]
        const terrainHexTypes = getShuffledArray(recordAsArray(props.terrainsCount).flatMap(([key, value]) => {
            return rangeArray(value).map(() => key)
        }))

        const circularNumbers = getShuffledArray(Array.from(props.circularNumberCount.entries()).flatMap(([key, value]) => {
            return rangeArray(value).map(() => key)
        }))

        const width = props.fieldWidth
        const height = props.fieldHeight
        const halfHeight = Math.round(height / 2)

        const hexes: CatanTerrainHex[] = []
        const hexPositions: Vector2D[] = []

        for (let y = 0; y < height; y++) {
            const rowWidth = width - Math.abs(halfHeight - y - 1)
            const shift = y < halfHeight ? y : halfHeight - 1
            for (let x = 0; x < rowWidth; x++) {
                const hexType = terrainHexTypes.pop()!
                const circularNumber = hexType == CatanTerrainHexType.DESERT ? 0 : circularNumbers.pop()!
                const postion = new Vector2D(x - shift, y).multiplied(6)
                const terrainHex: CatanTerrainHex = {
                    position: postion,
                    type: hexType,
                    circularNumber: circularNumber
                }
                hexes.push(terrainHex)
                hexPositions.push(postion)
            }
        }

        const harbourTypes = getShuffledArray(recordAsArray(props.harborsCount).flatMap(([key, value]) => {
            return rangeArray(value).map(() => key)
        }))


        const outRoads = hexes.flatMap(hex => getHexEdgesPositions(hex.position))
            .filter(edge => isOutEdge(edge, hexPositions))

        const harbours: CatanHarbour[] = []

        while (harbourTypes.length) {
            const index = _.random(0, outRoads.length - 1)
            const harbourPos = outRoads[index]!
            const harborType = harbourTypes.pop()!
            const neighborhoodsPositions = getEdgeNeighborhoodsPositions(harbourPos)
            const harbour: CatanHarbour = {
                position: harbourPos,
                type: harborType
            }
            harbours.push(harbour)
            removeElement(outRoads, harbourPos)
            removeCopmarableElements(outRoads, neighborhoodsPositions)
        }

        return {
            width: props.fieldWidth,
            height: props.fieldHeight,
            hexes: hexes,
            harbours: harbours,
            roads: [],
            intersections: [],
            robberPos: hexes.find(hex => hex.type == CatanTerrainHexType.DESERT)?.position!
        }
    }

}