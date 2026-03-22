import type { GameAction } from "../../../services/messages";
import type { Vector2DLike } from "../../commonTypes/vector2d";
import type { CatanIntersectionObjectType } from "./types";


export interface CatanGenerateFieldAction extends GameAction {
    type: 'CatanGenerateFieldAction';
}

export interface CatanEmbarkAction extends GameAction {
    type: 'CatanEmbarkAction';
    settlements: Vector2DLike[];
    roads: Vector2DLike[];
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
