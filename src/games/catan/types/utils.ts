import type { Player } from "../../../db/player";
import { recordEntries, recordForeach as recordForEach, removeElement } from "../../../utils/arrayUtils";
import { findByCoordsArray, getEdgeVerticesPositions, getVertexEdgesPositions } from "../../commonTypes/hex-grid/geometry";
import { Vector2D, type Vector2DLike } from "../../commonTypes/vector2d";
import {
    catanHarbourResourceType,
    CatanIntersectionObjectType,
    CatanResourceType,
    CatanTradeType,
    initResourcePrices,
    initResources,
    type CatanField,
    type CatanResourcePrices,
    type CatanResources,
    type CatanRoad,
    type CatanTradeDeal
} from "./types";

export const loaclityTypes = [CatanIntersectionObjectType.CITY, CatanIntersectionObjectType.SETTLEMENT]

export function getPlayerLocalities(field: CatanField, playerId: string) {
    return field.intersections.filter(int =>
        int.intersectionObjects.some(intObj => intObj.playerId == playerId && loaclityTypes.includes(intObj.type))
    )
}

export function getPlayerPrices(field: CatanField, playerId: string): CatanResourcePrices {
    const result = initResourcePrices({}, 4)
    const locals = getPlayerLocalities(field, playerId)
    const localsPositions = locals.map(loc => loc.position)
    for (let localPos of localsPositions) {
        const harboursPos = getVertexEdgesPositions(localPos)
        const harbours = findByCoordsArray(harboursPos, field.harbours)
        for (let harbour of harbours) {
            const resourceType = catanHarbourResourceType[harbour.type]
            if (!resourceType) {
                recordForEach(result, (k, v) => result[k] = Math.min(v, 3))
            } else {
                result[resourceType] = Math.min(result[resourceType], 2)
            }
        }
    }

    return result
}

export function getAllResourcesCount(resources: CatanResources) {
    return Object.values(resources).reduce((a, c) => a + c, 0)
}

export function checkDeal(deal: CatanTradeDeal, resourcePrices: CatanResourcePrices, availableResources: CatanResources) {
    if (getAllResourcesCount(deal.offered) == 0 || getAllResourcesCount(deal.required) == 0) {
        return false
    }
    if (deal.type == CatanTradeType.BANK) {
        let allOfferCount = 0
        for (let [offerKey, offerCount] of recordEntries(deal.offered)) {
            const price = resourcePrices[offerKey]
            if (offerCount % price != 0) {
                return false
            }
            if (offerCount > 0) {
                const availableResource = availableResources[offerKey]
                if (!availableResource || offerCount > availableResource) {
                    return false
                }
                allOfferCount += offerCount / price
            }
        }
        return allOfferCount == getAllResourcesCount(deal.required)
    }
    return true
}

export function moveAllResourcesByType(destination: CatanResources, source: CatanResources, resourceType: CatanResourceType) {
    destination[resourceType] += source[resourceType]
    source[resourceType] = 0
}

export function resourcesByTypes(...resourceType: CatanResourceType[]) {
    const result: CatanResources = initResources({})
    resourceType.forEach(resourceType => {
        result[resourceType]++
    })
    return result
}

export interface RoadEdge {
    road: CatanRoad
    links: RoadEdge[],
    intersects: IntersectNode[],
}

interface IntersectNode {
    edges: RoadEdge[],
    position: Vector2DLike
    stopFlag: boolean
}

interface RoadGraph {
    roads: RoadEdge[]
    intersects: IntersectNode[]
}

function processRoad(playerId: string, playerRoads: CatanRoad[], field: CatanField, roadNode: RoadEdge, part: RoadGraph): RoadGraph {
    removeElement(playerRoads, roadNode.road)
    part.roads.push(roadNode)
    const roadVertsPos = getEdgeVerticesPositions(roadNode.road.position)
    for (let vertPos of roadVertsPos) {
        const int = field.intersections.find(int => Vector2D.equals(int.position, vertPos))
        // Пересестить в поиск путей
        const nonPlayerObj = int?.intersectionObjects.filter(obj => obj.playerId != playerId)

        let intersectNode = part.intersects.find(int => Vector2D.equals(int.position, vertPos))
        if (!intersectNode) {
            intersectNode = {
                edges: [roadNode],
                position: vertPos,
                stopFlag: nonPlayerObj != undefined && nonPlayerObj.length > 0
            }
            part.intersects.push(intersectNode)
        }
        if (!roadNode.intersects.includes(intersectNode)) {
            roadNode.intersects.push(intersectNode)
        }
        if (nonPlayerObj && nonPlayerObj.length) {
            continue
        }
        const intRoadsPos = getVertexEdgesPositions(vertPos)
        const intRoads = findByCoordsArray(intRoadsPos, playerRoads)
        const subRoadNodes = intRoads.map(subRoad => {
            const subRoadNode: RoadEdge = {
                road: subRoad,
                links: [roadNode],
                intersects: [intersectNode]
            }
            removeElement(playerRoads, subRoadNode.road)
            return subRoadNode
        })
        intersectNode.edges.push(...subRoadNodes)
        for (let subRoadNode of subRoadNodes) {
            subRoadNode.links.push(...subRoadNodes.filter(node => node != subRoadNode))
            roadNode.links.push(subRoadNode)
            processRoad(playerId, playerRoads, field, subRoadNode, part)
        }
    }
    return part
}

export function getRoadsParts(playerId: string, playerRoads: CatanRoad[], field: CatanField) {
    let parts: RoadGraph[] = []
    while (playerRoads.length) {
        const roadNode: RoadEdge = {
            road: playerRoads[0]!,
            links: [],
            intersects: []
        }
        parts.push(processRoad(playerId, playerRoads, field, roadNode, { roads: [], intersects: [] }))
    }
    return parts
}

interface RoadPath {
    intersect: IntersectNode[]
    road: RoadEdge[]
}

function findLongestPathFromNode(start: IntersectNode, path: RoadPath, road: RoadEdge | undefined, depth: number): RoadPath {
    const pathCopy: RoadPath = {
        intersect: [...path.intersect],
        road: [...path.road]
    }
    pathCopy.intersect.push(start)
    if (road) {
        pathCopy.road.push(road)
    }
    let longestPath: RoadPath = pathCopy
    if (start.stopFlag) {
        return longestPath
    }
    for (let edge of start.edges.filter(edge => !pathCopy.road.includes(edge))) {
        const nonVisitedIntersects = edge.intersects.filter(intersect => intersect != start)
        if (nonVisitedIntersects.length <= 0) {
            continue
        }
        const linkPath = findLongestPathFromNode(nonVisitedIntersects[0]!, pathCopy, edge, depth + 1)
        if (linkPath.intersect.length > longestPath.intersect.length) {
            longestPath = linkPath
        }
    }
    return longestPath
}

export function findLongestPath(graph: RoadGraph): RoadPath {
    let longestPath: RoadPath = {
        intersect: [],
        road: []
    }
    for (let start of graph.intersects) {
        const path = findLongestPathFromNode(start, { road: [], intersect: [] }, undefined, 0)
        if (path.road.length > longestPath.road.length) {
            longestPath = path
        }
    }
    return longestPath
}

export function findLongestRoad(players: Player[], field: CatanField, minLength: number) {
    let longestPath: RoadPath = {
        intersect: [],
        road: []
    }
    for (let player of players) {
        const playerRoads = field.roads.filter(road => road.playerId == player.userId)
        if (playerRoads.length < minLength) {
            continue
        }
        const parts = getRoadsParts(player.userId, playerRoads, field)
        for (let part of parts) {
            const partLongestPath = findLongestPath(part)
            if (partLongestPath.intersect.length > longestPath.intersect.length) {
                longestPath = partLongestPath
            }
        }
    }
    return longestPath.road.map(edge => edge.road)
}

