import { recordEntries, recordForeach as recordForEach } from "../../../utils/arrayUtils";
import { findByCoordsArray, getVertexEdgesPositions } from "../../commonTypes/hex-grid/geometry";
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