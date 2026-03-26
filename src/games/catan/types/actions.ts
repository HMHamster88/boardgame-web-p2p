import type { GameAction } from "../../../services/messages";
import type { Vector2DLike } from "../../commonTypes/vector2d";
import type { CatanIntersectionObjectType, CatanResourceCount, CatanTradeDeal } from "./types";


export interface CatanGenerateFieldAction extends GameAction {
    type: 'CatanGenerateFieldAction';
}

export interface CatanEmbarkAction extends GameAction {
    type: 'CatanEmbarkAction';
    settlement: Vector2DLike;
    road: Vector2DLike;
}

export interface CatanRollDicesAction extends GameAction {
    type: 'CatanRollDicesAction';
}

export interface CatanBuildIntObjectAction extends GameAction {
    type: 'CatanBuildIntObjectAction'
    objectType: CatanIntersectionObjectType
    position: Vector2DLike
}

export interface CatanBuildRoadAction extends GameAction {
    type: 'CatanBuildRoadAction'
    position: Vector2DLike
}

export interface CatanEndTurnAction extends GameAction {
    type: 'CatanEndTurnAction'
}

export interface CatanDiscardResourceCards extends GameAction {
    type: 'CatanDiscardResourceCards'
    resources: CatanResourceCount[]
}

export interface CatanMoveRobberAction extends GameAction {
    type: 'CatanMoveRobberAction',
    position: Vector2DLike,
    playerToRob: string | undefined
}

export interface CatanTradeAction extends GameAction {
    type: 'CatanTradeAction'
    deal: CatanTradeDeal
}

export interface CatanTradeResponseAction extends GameAction {
    type: 'CatanTradeResponseAction'
    accepted: boolean
}

