import type { GameSettings } from "../../../db/game";
import type { GamePrivateState, GamePublicState, PlayerPrivateState, PlayerPublicState } from "../../../db/gameState";
import type { GameAction } from "../../../services/messages";
import type { Vector2DLike } from "../../commonTypes/vector2d";
import type { CatanGameFieldType } from "./catanGameFieldType";
import type { CatanTerrainHexType } from "./catanTerrainHexType";

export enum CatanGamePhase {
    EMBARK = "EMBARK",
    THROWING_DICE = "THROWING_DICE",
}

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
    intersections: CatanIntersection[]
}

export interface CatanGameSettings extends GameSettings {
    fieldType: CatanGameFieldType
    field: CatanField
}

export interface CatanPlayerPublicState extends PlayerPublicState {

}

export enum CatanDiceValue {
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
}

export interface CatanPrivateGameState extends GamePrivateState {
    playersStates: CatanPlayerPrivateState[]
}

export interface CatanGenerateFieldAction extends GameAction {
    type: 'CatanGenerateFieldAction'
}

export interface CatanEmbarkAction extends GameAction {
    type: 'CatanEmbarkAction',
    settlements: Vector2DLike[],
    roads: Vector2DLike[]
}

export interface CatanRollDicesAction extends GameAction {
    type: 'CatanRollDicesAction'
}