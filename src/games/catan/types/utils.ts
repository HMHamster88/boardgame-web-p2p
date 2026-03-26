import { getByType } from "../../../utils/arrayUtils";
import { findByCoordsArray, getVertexEdgesPositions } from "../../commonTypes/hex-grid/geometry";
import {
    catanHarbourResourceType,
    CatanIntersectionObjectType,
    CatanResourceType,
    CatanTradeType,
    type CatanField,
    type CatanResourceCount,
    type CatanResourcePrice,
    type CatanTradeDeal
} from "./types";

const resourceTypes = Object.keys(CatanResourceType).map(v => v as CatanResourceType)

export const loaclityTypes = [CatanIntersectionObjectType.CITY, CatanIntersectionObjectType.SETTLEMENT]

export function getPlayerLocalities(field: CatanField, playerId: string) {
    return field.intersections.filter(int =>
        int.intersectionObjects.some(intObj => intObj.playerId == playerId && loaclityTypes.includes(intObj.type))
    )
}

export function getPlayerPrices(field: CatanField, playerId: string): CatanResourcePrice[] {
    const result = resourceTypes.map(type => {
        const price: CatanResourcePrice = {
            type: type,
            price: 4
        }
        return price
    })
    const locals = getPlayerLocalities(field, playerId)
    const localsPositions = locals.map(loc => loc.position)
    for (let localPos of localsPositions) {
        const harboursPos = getVertexEdgesPositions(localPos)
        const harbours = findByCoordsArray(harboursPos, field.harbours)
        for (let harbour of harbours) {
            const resourceType = catanHarbourResourceType[harbour.type]
            if (!resourceType) {
                result.forEach(rp => rp.price = Math.min(rp.price, 3))
            } else {
                const resourcePrice = getByType(result, resourceType)!
                resourcePrice.price = Math.min(resourcePrice.price, 2)
            }
        }
    }

    return result
}

export function getAllResourcesCount(resources: CatanResourceCount[]) {
    return resources.map(resource => resource.count).reduce((a, c) => a + c, 0)
}

export function checkDeal(deal: CatanTradeDeal, resourcePrices: CatanResourcePrice[], availableResources: CatanResourceCount[]) {
    if (getAllResourcesCount(deal.offered) == 0 || getAllResourcesCount(deal.required) == 0) {
        return false
    }
    if (deal.type == CatanTradeType.BANK) {
        let allOfferCount = 0
        for (let offer of deal.offered) {
            const price = getByType(resourcePrices, offer.type)!
            if (offer.count % price.price != 0) {
                return false
            }
            if (offer.count > 0) {
                const availableResource = getByType(availableResources, offer.type)
                if (!availableResource || offer.count > availableResource.count) {
                    return false
                }
                allOfferCount += offer.count / price.price
            }
        }
        return allOfferCount == getAllResourcesCount(deal.required)
    }
    return true
}