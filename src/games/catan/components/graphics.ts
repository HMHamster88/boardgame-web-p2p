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

import cityImg from '../assets/intersection-objects/city.png'
import settlementImg from '../assets/intersection-objects/settlement.png'

import { CatanTerrainHexType } from "../types/catanTerrainHexType"
import { CatanDevelopmentCardType, CatanHarbourType, CatanIntersectionObjectType, CatanResourceType } from '../types/types'

export const portImage = portImg
export const roadImage = roadImg

import buidRoadsImg from '../assets/development-cards/build-roads.png'
import chapelImg from '../assets/development-cards/chapel.png'
import greatHallImg from '../assets/development-cards/great-hall.png'
import kinghtImg from '../assets/development-cards/knight.png'
import libraryImg from '../assets/development-cards/library.png'
import marketImg from '../assets/development-cards/market.png'
import monopolyImg from '../assets/development-cards/monopoly.png'
import universityImg from '../assets/development-cards/university.png'
import yearOfPlentyImg from '../assets/development-cards/year-of-plenty.png'

export const developmentCardsImgs: Record<CatanDevelopmentCardType, string> = {
    [CatanDevelopmentCardType.KNIGNT]: kinghtImg,
    [CatanDevelopmentCardType.BUILD_ROADS]: buidRoadsImg,
    [CatanDevelopmentCardType.MONOPOLY]: monopolyImg,
    [CatanDevelopmentCardType.YEAR_OF_PLENTY]: yearOfPlentyImg,
    [CatanDevelopmentCardType.CHAPEL]: chapelImg,
    [CatanDevelopmentCardType.GREAT_HALL]: greatHallImg,
    [CatanDevelopmentCardType.LIBRARY]: libraryImg,
    [CatanDevelopmentCardType.MARKET]: marketImg,
    [CatanDevelopmentCardType.UNIVERSITY]: universityImg
}

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