import { v4 as uuidv4 } from 'uuid'
import type { Component } from "vue";
import { GameStatusEnum, type CrateGameProps } from "../../db/game";
import type Game from "../../db/game";
import type { GameState } from "../../db/gameState";
import type { GameObjectSyncs, GameService } from "../../services/gameService/gameService";
import { handleMessage, type GameAction } from "../../services/messages";
import CatanSettings from "./components/CatanSettings.vue";
import CatanGameView from "./components/CatanGameView.vue";
import {
    CatanBuyItemType,
    CatanDiceValue,
    CatanGamePhase,
    CatanIntersectionObjectType,
    getBuyItems,
    intersectionObjectRoBuyItem,
    type CatanField,
    type CatanGameSettings,
    type CatanHarbour,
    type CatanIntersection,
    type CatanPlayerPrivateState,
    type CatanPlayerPublicState,
    type CatanPrivateGameState,
    type CatanPublicGameState,
    type CatanResourceCount,
    type CatanRoad,
    type CatanTerrainHex
} from "./types/types";
import { type CatanBuildIntObjectAction, type CatanBuildRoadAction, type CatanEmbarkAction, type CatanEndTurnAction } from "./types/actions";
import { CatanTerrainHexType } from "./types/catanTerrainHexType";
import { CatanGameFieldType } from "./types/catanGameFieldType";
import { getShuffledArray, rangeArray, recordAsArray, removeCopmarableElements, removeElement } from '../../utils/arrayUtils';
import { Vector2D } from '../commonTypes/vector2d';
import { findByCoordsArray, getEdgeNeighborhoodsPositions, getHexEdgesPositions, getHexVerticesPositions, getVertexHexesPositions, isOutEdge } from '../commonTypes/hex-grid/geometry';
import _ from 'lodash';
import { distinct } from '../commonTypes/hex-grid/hexData';
import { sleep } from '../../utils/functionUtils';

export function getService(): GameService {
    return new CatanGameService()
}

export class CatanGameService implements GameService {
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
                points: 0
            }
            return state
        })
        const publicState: CatanPublicGameState = {
            field: settings.field,
            phase: CatanGamePhase.EMBARK,
            activePlayerIndex: _.random(0, game.players.length - 1),
            winnersIds: [],
            playersStates: publicPlayersStates,
            dices: {
                redDice: CatanDiceValue.ONE,
                yellowDice: CatanDiceValue.ONE
            }
        }
        const privatePlayerStates = game.players.map(player => {
            const state: CatanPlayerPrivateState = {
                playerId: player.userId,
                resources: []
            }
            return state
        })

        const privateState: CatanPrivateGameState = {
            playersStates: privatePlayerStates
        }
        const gameState: GameState = {
            id: game.id,
            publicState: publicState,
            privateState: privateState
        }

        game.status = GameStatusEnum.STARTED

        return gameState
    }

    performAction(game: Game, gameState: GameState, gameAction: GameAction, playerId: string, syncs: GameObjectSyncs): void {
        const settings = game.settings as CatanGameSettings
        handleMessage({
            onCatanGenerateFieldAction: () => {
                settings.field = this.generateField(settings.fieldType)
                syncs.gameSync?.sendUpdate('settings')
            },
            onCatanEmbarkAction: (action: CatanEmbarkAction) => {
                const publicState = gameState.publicState as CatanPublicGameState
                const field = publicState.field
                const settlements = action.settlements.map(pos => {
                    const intersection: CatanIntersection = {
                        position: pos,
                        intersectionObjects: [
                            {
                                playerId: playerId,
                                type: CatanIntersectionObjectType.SETTLEMENT
                            }
                        ]
                    }
                    return intersection
                })
                const roads = action.roads.map(pos => {
                    const road: CatanRoad = {
                        playerId: playerId,
                        position: pos
                    }
                    return road
                })
                field.intersections.push(...settlements)
                field.roads.push(...roads)

                const privateState = gameState.privateState as CatanPrivateGameState
                const playerPrivateState = privateState.playersStates.find(pl => pl.playerId == playerId)!

                const secondObject = settlements[1]!
                const hexPoitions = getVertexHexesPositions(secondObject.position!)
                const hexes = hexPoitions.map(hexPos => field.hexes.find(hex => Vector2D.equals(hexPos, hex.position))).filter(hex => hex)
                const resources = hexes.map(hex => hex?.type!)
                    .map(hexType => this.getHexResources(hexType, secondObject.intersectionObjects[0]?.type!))
                resources.forEach(resource => this.addResources(playerPrivateState, resource))


                publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
                if (distinct(field.roads.map(road => road.playerId), k => k).length == game.players.length) {
                    publicState.phase = CatanGamePhase.THROWING_DICE
                }

                syncs.playerPrivateStateSync.get(playerId)?.sendUpdate('resources', playerId)
                syncs.gamePublicStateSync?.sendUpdate(['field.intersections', 'field.roads', 'activePlayerIndex', 'phase'])
            },
            onCatanRollDicesAction: async () => {
                const publicState = gameState.publicState as CatanPublicGameState
                const dices = publicState.dices

                dices.redDice = 0
                dices.yellowDice = 0
                syncs.gamePublicStateSync?.sendUpdate('dices')
                await sleep(1000)

                dices.redDice = _.random(CatanDiceValue.ONE, CatanDiceValue.SIX)
                dices.yellowDice = _.random(CatanDiceValue.ONE, CatanDiceValue.SIX)

                const allDiceValue = (publicState.dices.redDice as number) + (publicState.dices.yellowDice)

                const field = publicState.field
                const hexes = field.hexes.filter(hex => hex.circularNumber == allDiceValue)

                const playersUpdateId: string[] = []
                const privateState = gameState.privateState as CatanPrivateGameState
                for (let hex of hexes) {
                    const intObjects = findByCoordsArray(getHexVerticesPositions(hex.position), field.intersections)
                        .flatMap(int => int.intersectionObjects)
                    intObjects.forEach(intObject => {
                        const resources = this.getHexResources(hex.type, intObject.type)
                        if (resources.length) {
                            const playerState = privateState.playersStates.find(player => player.playerId == intObject.playerId)!
                            this.addResources(playerState, resources)
                            playersUpdateId.push(playerState.playerId)
                        }
                    })
                }

                playersUpdateId.forEach(playerId => syncs.playerPrivateStateSync.get(playerId)?.sendUpdate('resources'))

                publicState.phase = CatanGamePhase.PLAYER_TURN
                syncs.gamePublicStateSync?.sendUpdate(['dices', 'phase'])
            },
            onCatanBuildRoadAction: (action: CatanBuildRoadAction) => {
                const publicState = gameState.publicState as CatanPublicGameState
                const privateState = gameState.privateState as CatanPrivateGameState
                const playerPrivateState = privateState.playersStates.find(pl => pl.playerId == playerId)!
                const field = publicState.field

                const resources = getBuyItems().find(item => item.type == CatanBuyItemType.ROAD)?.resources!
                if (!this.checkPlayerHasResources(playerPrivateState, resources)) {
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
                this.removeResources(playerPrivateState, resources)
                syncs.playerPrivateStateSync.get(playerId)?.sendUpdate('resources')
                syncs.gamePublicStateSync?.sendUpdate('field.roads')
            },
            onCatanBuildIntObjectAction: (action: CatanBuildIntObjectAction) => {
                const publicState = gameState.publicState as CatanPublicGameState
                const privateState = gameState.privateState as CatanPrivateGameState
                const playerPrivateState = privateState.playersStates.find(pl => pl.playerId == playerId)!
                const field = publicState.field

                const buyItemType = intersectionObjectRoBuyItem(action.objectType)!
                const resources = getBuyItems().find(item => item.type == buyItemType)?.resources!
                if (!this.checkPlayerHasResources(playerPrivateState, resources)) {
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

                this.removeResources(playerPrivateState, resources)
                syncs.playerPrivateStateSync.get(playerId)?.sendUpdate('resources')
                syncs.gamePublicStateSync?.sendUpdate('field.intersections')
            },
            onCatanEndTurnAction: (_action: CatanEndTurnAction) => {
                const publicState = gameState.publicState as CatanPublicGameState
                publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
                publicState.phase = CatanGamePhase.THROWING_DICE
                syncs.gamePublicStateSync?.sendUpdate(['activePlayerIndex', 'phase'])
            }
        }, gameAction)

    }

    checkPlayerHasResources(playerState: CatanPlayerPrivateState, resources: CatanResourceCount[]): boolean {
        for (let resource of resources) {
            let playerResource = playerState.resources.find(rc => rc.type == resource.type)
            if (!playerResource) {
                return false
            }
            if (playerResource.count < resource.count) {
                return false
            }
        }
        return true
    }

    removeResources(playerState: CatanPlayerPrivateState, resources: CatanResourceCount[]): boolean {
        if (!this.checkPlayerHasResources(playerState, resources)) {
            return false
        }

        for (let resource of resources) {
            let playerResource = playerState.resources.find(rc => rc.type == resource.type)!
            playerResource.count -= resource.count
        }

        return true
    }

    addResources(playerState: CatanPlayerPrivateState, resources: CatanResourceCount[]) {
        for (let resource of resources) {
            let playerResource = playerState.resources.find(rc => rc.type == resource.type)
            if (!playerResource) {
                playerState.resources.push(resource)
            } else {
                playerResource.count += resource.count
            }
        }
    }

    getHexResources(hex: CatanTerrainHexType, objectType: CatanIntersectionObjectType): CatanResourceCount[] {
        const mainResource = CatanTerrainHexType.props[hex].mainResource
        if (!mainResource) {
            return []
        }

        if (objectType == CatanIntersectionObjectType.SETTLEMENT) {
            return [{
                type: mainResource,
                count: 1
            }]
        } else if (objectType == CatanIntersectionObjectType.CITY) {
            return [{
                type: mainResource,
                count: 2
            }]
        }
        return []
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
        }
    }

}