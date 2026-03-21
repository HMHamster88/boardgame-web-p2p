import { CatanTerrainHexType } from "./catanTerrainHexType"
import { CatanHarbourType } from "./types"


export enum CatanGameFieldType {
    CLASSIC = "CLASSIC",
    EXTENDED = "EXTENDED"
}
type CatanTerrainHexTypeRecord = Record<CatanTerrainHexType, number>

type CatanHarbourTypeRecord = Record<CatanHarbourType, number>

export interface CatanFieldTypeProps {
    fieldWidth: number
    fieldHeight: number

    terrainsCount: CatanTerrainHexTypeRecord
    circularNumberCount: Map<number, number>
    harborsCount: CatanHarbourTypeRecord
}

type CatanFieldTypePropsRecord = Record<CatanGameFieldType, CatanFieldTypeProps>

export namespace CatanGameFieldType {
    export const props: CatanFieldTypePropsRecord = {
        [CatanGameFieldType.CLASSIC]: {
            fieldWidth: 5,
            fieldHeight: 5,
            terrainsCount: {
                [CatanTerrainHexType.FIELDS]: 4,
                [CatanTerrainHexType.MOUNTAINS]: 3,
                [CatanTerrainHexType.HILLS]: 3,
                [CatanTerrainHexType.DESERT]: 1,
                [CatanTerrainHexType.FOREST]: 4,
                [CatanTerrainHexType.PASTURE]: 4
            },
            circularNumberCount: new Map([
                [6, 2],
                [3, 2],
                [8, 2],
                [2, 1],
                [4, 2],
                [5, 2],
                [10, 2],
                [9, 2],
                [11, 2],
                [12, 1]
            ]),
            harborsCount: {
                [CatanHarbourType.WOOD]: 1,
                [CatanHarbourType.ORE]: 1,
                [CatanHarbourType.CLAY]: 1,
                [CatanHarbourType.WOOL]: 1,
                [CatanHarbourType.GRAIN]: 1,
                [CatanHarbourType.THREE_TO_ONE]: 4
            }
        },
        [CatanGameFieldType.EXTENDED]: {
            fieldWidth: 6,
            fieldHeight: 7,
            terrainsCount: {
                [CatanTerrainHexType.FIELDS]: 6,
                [CatanTerrainHexType.MOUNTAINS]: 5,
                [CatanTerrainHexType.HILLS]: 5,
                [CatanTerrainHexType.DESERT]: 2,
                [CatanTerrainHexType.FOREST]: 6,
                [CatanTerrainHexType.PASTURE]: 6
            },
            circularNumberCount: new Map([
                [6, 3],
                [3, 3],
                [8, 3],
                [2, 2],
                [4, 3],
                [5, 2],
                [10, 3],
                [9, 3],
                [11, 3],
                [12, 3] // Уточнить
            ]),
            harborsCount: {
                [CatanHarbourType.WOOD]: 1,
                [CatanHarbourType.ORE]: 1,
                [CatanHarbourType.CLAY]: 1,
                [CatanHarbourType.WOOL]: 2,
                [CatanHarbourType.GRAIN]: 1,
                [CatanHarbourType.THREE_TO_ONE]: 4
            }
        }
    }
}