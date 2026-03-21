import { CatanResourceType } from "./types"


export enum CatanTerrainHexType {
    HILLS = "HILLS",
    FOREST = "FOREST",
    MOUNTAINS = "MOUNTAINS",
    FIELDS = "FIELDS",
    PASTURE = "PASTURE",
    DESERT = "DESERT"
}

interface CatanTerrainHexTypeProps {
    mainResource: CatanResourceType | undefined
}

type CatanFieldTypePropsRecord = Record<CatanTerrainHexType, CatanTerrainHexTypeProps>

export namespace CatanTerrainHexType {
    export const props: CatanFieldTypePropsRecord = {
        [CatanTerrainHexType.HILLS]: {
            mainResource: CatanResourceType.CLAY
        },
        [CatanTerrainHexType.FOREST]: {
            mainResource: CatanResourceType.WOOD
        },
        [CatanTerrainHexType.MOUNTAINS]: {
            mainResource: CatanResourceType.ORE
        },
        [CatanTerrainHexType.FIELDS]: {
            mainResource: CatanResourceType.GRAIN
        },
        [CatanTerrainHexType.PASTURE]: {
            mainResource: CatanResourceType.WOOL
        },
        [CatanTerrainHexType.DESERT]: {
            mainResource: undefined
        },
    }
}