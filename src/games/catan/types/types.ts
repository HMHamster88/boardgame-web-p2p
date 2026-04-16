import type { GameSettings } from "../../../db/game";
import type { GamePrivateState, GamePublicState, PlayerPrivateState, PlayerPublicState } from "../../../db/gameState";
import { initEnumRecord } from "../../../utils/arrayUtils";
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

export enum CatanResourceType {
    WOOD = "WOOD",
    WOOL = "WOOL",
    GRAIN = "GRAIN",
    CLAY = "CLAY",
    ORE = "ORE"
}

export enum CatanDevelopmentCardType {
    KNIGNT = 'KNIGHT',
    BUILD_ROADS = 'BUILD_ROADS',
    MONOPOLY = 'MONOPOLY',
    YEAR_OF_PLENTY = 'YEAR_OF_PLENTY',
    CHAPEL = 'CHAPEL',
    GREAT_HALL = 'GREAT_HALL',
    LIBRARY = 'LIBRARY',
    MARKET = 'MARKET',
    UNIVERSITY = 'UNIVERSITY'
}

export const developmentCardsCount: Record<CatanDevelopmentCardType, number> = {
    [CatanDevelopmentCardType.KNIGNT]: 14,
    [CatanDevelopmentCardType.BUILD_ROADS]: 2,
    [CatanDevelopmentCardType.MONOPOLY]: 2,
    [CatanDevelopmentCardType.YEAR_OF_PLENTY]: 2,
    [CatanDevelopmentCardType.CHAPEL]: 1,
    [CatanDevelopmentCardType.GREAT_HALL]: 1,
    [CatanDevelopmentCardType.LIBRARY]: 1,
    [CatanDevelopmentCardType.MARKET]: 1,
    [CatanDevelopmentCardType.UNIVERSITY]: 1
}

export const developmentCardIsUsable: Record<CatanDevelopmentCardType, boolean> = {
    [CatanDevelopmentCardType.KNIGNT]: true,
    [CatanDevelopmentCardType.BUILD_ROADS]: true,
    [CatanDevelopmentCardType.MONOPOLY]: true,
    [CatanDevelopmentCardType.YEAR_OF_PLENTY]: true,
    [CatanDevelopmentCardType.CHAPEL]: false,
    [CatanDevelopmentCardType.GREAT_HALL]: false,
    [CatanDevelopmentCardType.LIBRARY]: false,
    [CatanDevelopmentCardType.MARKET]: false,
    [CatanDevelopmentCardType.UNIVERSITY]: false
}

export const developmentCardPoints: Record<CatanDevelopmentCardType, number> = {
    [CatanDevelopmentCardType.KNIGNT]: 0,
    [CatanDevelopmentCardType.BUILD_ROADS]: 0,
    [CatanDevelopmentCardType.MONOPOLY]: 0,
    [CatanDevelopmentCardType.YEAR_OF_PLENTY]: 0,
    [CatanDevelopmentCardType.CHAPEL]: 1,
    [CatanDevelopmentCardType.GREAT_HALL]: 1,
    [CatanDevelopmentCardType.LIBRARY]: 1,
    [CatanDevelopmentCardType.MARKET]: 1,
    [CatanDevelopmentCardType.UNIVERSITY]: 1
}

export const developmentCardSaves: Record<CatanDevelopmentCardType, boolean> = {
    [CatanDevelopmentCardType.KNIGNT]: true,
    [CatanDevelopmentCardType.BUILD_ROADS]: false,
    [CatanDevelopmentCardType.MONOPOLY]: false,
    [CatanDevelopmentCardType.YEAR_OF_PLENTY]: false,
    [CatanDevelopmentCardType.CHAPEL]: false,
    [CatanDevelopmentCardType.GREAT_HALL]: false,
    [CatanDevelopmentCardType.LIBRARY]: false,
    [CatanDevelopmentCardType.MARKET]: false,
    [CatanDevelopmentCardType.UNIVERSITY]: false
}

export enum CatanHarbourType {
    THREE_TO_ONE = "THREE_TO_ONE",
    CLAY = "CLAY",
    ORE = "ORE",
    GRAIN = "GRAIN",
    WOOL = "WOOL",
    WOOD = "WOOD",
}

export const catanHarbourResourceType: Record<CatanHarbourType, CatanResourceType | undefined> = {
    [CatanHarbourType.THREE_TO_ONE]: undefined,
    [CatanHarbourType.CLAY]: CatanResourceType.CLAY,
    [CatanHarbourType.ORE]: CatanResourceType.ORE,
    [CatanHarbourType.GRAIN]: CatanResourceType.GRAIN,
    [CatanHarbourType.WOOL]: CatanResourceType.WOOL,
    [CatanHarbourType.WOOD]: CatanResourceType.WOOD,
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
    maxPoints: number
}

export enum CatanSpecialCard {
    BIGGEST_ARMY = 'BIGGEST_ARMY',
    LONGEST_ROAD = 'LONGEST_ROAD'
}

export interface CatanPlayerPublicState extends PlayerPublicState {
    openedDevelopmentCards: CatanDevelopmentCardType[],
    specialCards: CatanSpecialCard[]
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

export interface CatanPlayerTradeOffer {
    playerId: string,
    offered: CatanResources
    required: CatanResources,
    rejectedPlayerIds: string[]
}

export interface CatanPublicGameState extends GamePublicState {
    field: CatanField
    phase: CatanGamePhase
    playersStates: CatanPlayerPublicState[]
    dices: CatanDices,
    playerTradeOffer: CatanPlayerTradeOffer | undefined,
    longestRoad: CatanRoad[]
}

export type CatanResources = Record<CatanResourceType, number>

export function initResources(intVal: Partial<Record<CatanResourceType, number>>): CatanResources {
    return initEnumRecord<CatanResourceType, number>(CatanResourceType, intVal, 0)
}

export type CatanResourcePrices = Record<CatanResourceType, number>

export function initResourcePrices(intVal: Partial<Record<CatanResourceType, number>>, defaultValue: number): CatanResourcePrices {
    return initEnumRecord<CatanResourceType, number>(CatanResourceType, intVal, defaultValue)
}

export enum CatanTradeType {
    BANK = "BANK",
    PLAYER = "PLAYER"
}

export interface CatanTradeDeal {
    type: CatanTradeType
    offered: CatanResources
    required: CatanResources
}

export interface CatanPlayerPrivateState extends PlayerPrivateState {
    resources: CatanResources
    developmentCards: CatanDevelopmentCardType[]
    discardCardsCount: number,
    freeBuildings: CatanBuyItemType[]
}

export interface CatanPrivateGameState extends GamePrivateState {
    playersStates: CatanPlayerPrivateState[]
    developmentCardsDeck: CatanDevelopmentCardType[]
    developmentCardDiscardPile: CatanDevelopmentCardType[]
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
    resources: CatanResources
}

export function getBuyItems(): CatanBuyItem[] {
    return [
        {
            type: CatanBuyItemType.ROAD,
            resources: initResources({
                [CatanResourceType.WOOD]: 1,
                [CatanResourceType.CLAY]: 1,
            })
        },
        {
            type: CatanBuyItemType.SETTLEMENT,
            resources: initResources({
                [CatanResourceType.WOOD]: 1,
                [CatanResourceType.CLAY]: 1,
                [CatanResourceType.GRAIN]: 1,
                [CatanResourceType.WOOL]: 1,
            })
        },
        {
            type: CatanBuyItemType.CITY,
            resources: initResources({
                [CatanResourceType.GRAIN]: 2,
                [CatanResourceType.ORE]: 3,
            })
        },
        {
            type: CatanBuyItemType.DEVELOPMENT_CARD,
            resources: initResources({
                [CatanResourceType.GRAIN]: 1,
                [CatanResourceType.WOOL]: 1,
                [CatanResourceType.ORE]: 1,
            })
        }
    ]
}