import desertImg from '../assets/terrain/DESERT.png'
import fieldsImg from '../assets/terrain/FIELDS.png'
import forestImg from '../assets/terrain/FOREST.png'
import hillsImg from '../assets/terrain/HILLS.png'
import mountainsImg from '../assets/terrain/MOUNTAINS.png'
import pastureImg from '../assets/terrain/PASTURE.png'

import portImg from '../assets/port.png'
import roadImg from '../assets/road.png'

import bricsImg from '../assets/resources/bricks.png'
import oreImg from '../assets/resources/ore.png'
import sheepImg from '../assets/resources/sheep.png'
import wheatImg from '../assets/resources/wheat.png'
import woodImg from '../assets/resources/wood.png'

import bricsCardImg from '../assets/resource-cards/bricks.png'
import oreCardImg from '../assets/resource-cards/ore.png'
import sheepCardImg from '../assets/resource-cards/sheep.png'
import wheatCardImg from '../assets/resource-cards/wheat.png'
import woodCardImg from '../assets/resource-cards/wood.png'

import settlementImg from '../assets/intersection-objects/settlement.png'
import cityImg from '../assets/intersection-objects/city.png'

import { CatanHarbourType, CatanIntersectionObjectType, CatanResourceType } from '../types/types'
import { CatanTerrainHexType } from "../types/catanTerrainHexType"

export const portImage = portImg
export const roadImage = roadImg

export const resourceCardsImg: Record<CatanResourceType, string> = {
    [CatanResourceType.CLAY]: bricsCardImg,
    [CatanResourceType.GRAIN]: wheatCardImg,
    [CatanResourceType.ORE]: oreCardImg,
    [CatanResourceType.WOOD]: woodCardImg,
    [CatanResourceType.WOOL]: sheepCardImg
}

export const resourcesImages: Record<CatanResourceType, string> = {
    [CatanHarbourType.CLAY]: bricsImg,
    [CatanHarbourType.ORE]: oreImg,
    [CatanHarbourType.WOOL]: sheepImg,
    [CatanHarbourType.GRAIN]: wheatImg,
    [CatanHarbourType.WOOD]: woodImg,
}

export const terrainImages = [
    {
        type: CatanTerrainHexType.DESERT,
        img: desertImg
    },
    {
        type: CatanTerrainHexType.FIELDS,
        img: fieldsImg
    },
    {
        type: CatanTerrainHexType.FOREST,
        img: forestImg
    },
    {
        type: CatanTerrainHexType.HILLS,
        img: hillsImg
    },
    {
        type: CatanTerrainHexType.MOUNTAINS,
        img: mountainsImg
    },
    {
        type: CatanTerrainHexType.PASTURE,
        img: pastureImg
    },
]

export const harbourResourcesImages = new Map<CatanHarbourType, string>([
    [CatanHarbourType.CLAY, bricsImg],
    [CatanHarbourType.ORE, oreImg],
    [CatanHarbourType.WOOL, sheepImg],
    [CatanHarbourType.GRAIN, wheatImg],
    [CatanHarbourType.WOOD, woodImg],
])

export const intersectionObjectsImages = new Map<CatanIntersectionObjectType, string>([
    [CatanIntersectionObjectType.SETTLEMENT, settlementImg],
    [CatanIntersectionObjectType.CITY, cityImg],
])