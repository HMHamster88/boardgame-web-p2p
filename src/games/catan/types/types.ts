import type { GameSettings } from "../../../db/game";
import type { GamePrivateState, GamePublicState, PlayerPrivateState, PlayerPublicState } from "../../../db/gameState";
import type { Vector2DLike } from "../../commonTypes/vector2d";
import type { CatanGameFieldType } from "./catanGameFieldType";
import type { CatanTerrainHexType } from "./catanTerrainHexType";

export enum CatanGamePhase {
    EMBARK_FIRST = "EMBARK_FIRST",
    EMBARK_SECOND = "EMBARK_SECOND",
    THROWING_DICE = "THROWING_DICE",
    PLAYER_TURN = "PLAYER_TURN",
    DISCARD_CARDS_7 = "DISCARD_CARDS_7",
    MOVE_ROBBER = "MOVE_ROBBER"
}

export const catanEmbarkPhases: readonly CatanGamePhase[] = [
    CatanGamePhase.EMBARK_FIRST,
    CatanGamePhase.EMBARK_SECOND
]

export enum CatanHarbourType {
    THREE_TO_ONE = "THREE_TO_ONE",
    CLAY = "CLAY",
    ORE = "ORE",
    GRAIN = "GRAIN",
    WOOL = "WOOL",
    WOOD = "WOOD",
}

export enum CatanResourceType {
    WOOD = "WOOD",
    WOOL = "WOOL",
    GRAIN = "GRAIN",
    CLAY = "CLAY",
    ORE = "ORE"
}

export interface CatanTerrainHex {
    position: Vector2DLike
    type: CatanTerrainHexType
    circularNumber: number
}

export interface CatanRoad {
    position: Vector2DLike
    playerId: string
}

export interface CatanHarbour {
    position: Vector2DLike
    type: CatanHarbourType
}

export enum CatanIntersectionObjectType {
    SETTLEMENT = "SETTLEMENT",
    CITY = "CITY",
}

export interface CatanIntersectionObject {
    playerId: string;
    type: CatanIntersectionObjectType
}

export interface CatanIntersection {
    position: Vector2DLike
    intersectionObjects: CatanIntersectionObject[]
}

export interface CatanField {
    width: number
    height: number
    hexes: CatanTerrainHex[]
    harbours: CatanHarbour[]
    roads: CatanRoad[]
    intersections: CatanIntersection[],
    robberPos: Vector2DLike
}

export interface CatanGameSettings extends GameSettings {
    fieldType: CatanGameFieldType
    field: CatanField
}

export interface CatanPlayerPublicState extends PlayerPublicState {

}

export enum CatanDiceValue {
    NONE = 0,
    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6
}

export interface CatanDices {
    redDice: CatanDiceValue,
    yellowDice: CatanDiceValue
}

export interface CatanPublicGameState extends GamePublicState {
    field: CatanField
    phase: CatanGamePhase
    playersStates: CatanPlayerPublicState[]
    dices: CatanDices
}

export interface CatanResourceCount {
    type: CatanResourceType,
    count: number
}

export interface CatanPlayerPrivateState extends PlayerPrivateState {
    resources: CatanResourceCount[]
    discardCardsCount: number
}

export interface CatanPrivateGameState extends GamePrivateState {
    playersStates: CatanPlayerPrivateState[]
}

export enum CatanBuyItemType {
    ROAD = 'ROAD',
    SETTLEMENT = 'SETTLEMENT',
    CITY = 'CITY',
    DEVELOPMENT_CARD = 'DEVELOPMENT_CARD'
}

export function buyItemToIntersectionObject(item: CatanBuyItemType): CatanIntersectionObjectType | undefined {
    return CatanBuyItemType[item] as any as CatanIntersectionObjectType
}

export function intersectionObjectRoBuyItem(item: CatanIntersectionObjectType): CatanBuyItemType | undefined {
    return CatanIntersectionObjectType[item] as any as CatanBuyItemType
}

export interface CatanBuyItem {
    type: CatanBuyItemType
    resources: CatanResourceCount[]
}

export function getBuyItems(): CatanBuyItem[] {
    return [
        {
            type: CatanBuyItemType.ROAD,
            resources: [
                {
                    type: CatanResourceType.WOOD,
                    count: 1
                },
                {
                    type: CatanResourceType.CLAY,
                    count: 1
                }
            ]
        },
        {
            type: CatanBuyItemType.SETTLEMENT,
            resources: [
                {
                    type: CatanResourceType.WOOD,
                    count: 1
                },
                {
                    type: CatanResourceType.CLAY,
                    count: 1
                },
                {
                    type: CatanResourceType.GRAIN,
                    count: 1
                },
                {
                    type: CatanResourceType.WOOL,
                    count: 1
                }
            ]
        },
        {
            type: CatanBuyItemType.CITY,
            resources: [
                {
                    type: CatanResourceType.GRAIN,
                    count: 2
                },
                {
                    type: CatanResourceType.ORE,
                    count: 3
                }
            ]
        },
        {
            type: CatanBuyItemType.DEVELOPMENT_CARD,
            resources: [
                {
                    type: CatanResourceType.GRAIN,
                    count: 1
                },
                {
                    type: CatanResourceType.WOOL,
                    count: 1
                },
                {
                    type: CatanResourceType.ORE,
                    count: 1
                }
            ]
        }
    ]
}