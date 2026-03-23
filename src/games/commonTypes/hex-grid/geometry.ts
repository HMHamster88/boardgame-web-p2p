import type { HexData, PositionData } from "./hexData";
import { Vector2D, type Vector2DLike } from "../vector2d";

export function range(n: number): number[] {
    return Array.from(Array(n).keys());
}

export function pointyHexToPixel(hex: Vector2DLike, size: number): Vector2D {
    var x = (Math.sqrt(3) * hex.x + Math.sqrt(3) / 2 * hex.y) * size
    var y = (3. / 2 * hex.y) * size
    return new Vector2D(x, y)
}

export function getHexVerticesPositions(hexPosition: Vector2DLike): Vector2D[] {
    const position = Vector2D.from(hexPosition)
    return [
        position.added(new Vector2D(2, 2)),
        position.added(new Vector2D(4, -2)),
        position.added(new Vector2D(2, -4)),
        position.added(new Vector2D(-2, -2)),
        position.added(new Vector2D(-4, 2)),
        position.added(new Vector2D(-2, 4)),
    ]
}

export function getHexEdgesPositions(hexPosition: Vector2DLike): Vector2D[] {
    const position = Vector2D.from(hexPosition)
    return [
        position.added(new Vector2D(3, 0)),
        position.added(new Vector2D(3, -3)),
        position.added(new Vector2D(0, -3)),
        position.added(new Vector2D(-3, 0)),
        position.added(new Vector2D(-3, 3)),
        position.added(new Vector2D(0, 3)),
    ]
}

export function getHexNeighborhoodsPositions(hexPosition: Vector2DLike): Vector2D[] {
    const position = Vector2D.from(hexPosition)
    return [
        position.added(new Vector2D(0, 6)),
        position.added(new Vector2D(6, 0)),
        position.added(new Vector2D(6, -6)),
        position.added(new Vector2D(0, -6)),
        position.added(new Vector2D(-6, 0)),
        position.added(new Vector2D(-6, 6)),
    ]
}

export function isOutEdge(position: Vector2D, hexPositions: Vector2D[]): boolean {
    const edgeHexes = getEdgeHexesPositions(position)
    return hexPositions.filter(pos => pos.equals(edgeHexes[0]!) || pos.equals(edgeHexes[1]!)).length == 1
}

export function isHexCoords(position: Vector2D): boolean {
    return position.x % 6 == 0 && position.y % 6 == 0
}

export function isEdgeCoords(position: Vector2D): boolean {
    return position.x % 3 == 0 && position.y % 3 == 0 && !isHexCoords(position)
}

export function isVertexCoords(position: Vector2D): boolean {
    return !isEdgeCoords(position) && !isHexCoords(position)
}

export function isLowerVertex(position: Vector2D) {
    return position.y % 2 == 0 && (position.y + 2) % 6 == 0
}

export function getVertexNeighborhoodsPositions(vertexPosition: Vector2DLike): Vector2D[] {
    const position = Vector2D.from(vertexPosition)
    if (isLowerVertex(position)) {
        return [
            position.added(new Vector2D(-2, -2)),
            position.added(new Vector2D(-2, 4)),
            position.added(new Vector2D(4, -2)),
        ]
    }
    return [
        position.added(new Vector2D(2, -4)),
        position.added(new Vector2D(2, 2)),
        position.added(new Vector2D(-4, 2)),
    ]
}

export function getVertexEdgesPositions(positionLike: Vector2DLike): Vector2D[] {
    const position = Vector2D.from(positionLike)
    if (isLowerVertex(position)) {
        return [
            position.added(new Vector2D(-1, 2)),
            position.added(new Vector2D(2, -1)),
            position.added(new Vector2D(-1, -1)),
        ]
    }
    return [
        position.added(new Vector2D(1, 1)),
        position.added(new Vector2D(1, -2)),
        position.added(new Vector2D(-2, 1)),
    ]

}

export function getVertexHexesPositions(positionLike: Vector2DLike): Vector2D[] {
    const position = new Vector2D(positionLike.x, positionLike.y)
    if (isLowerVertex(position)) {
        return [
            position.added(new Vector2D(2, 2)),
            position.added(new Vector2D(2, -4)),
            position.added(new Vector2D(-4, 2)),
        ]
    }
    return [
        position.added(new Vector2D(-2, 4)),
        position.added(new Vector2D(4, -2)),
        position.added(new Vector2D(-2, -2)),
    ]
}

export function getEdgeAnge(position: Vector2DLike) {
    if (position.y % 2 != 0 && position.x % 2 != 0) {
        return -60;
    }
    if (position.x % 2 == 0) {

        return 60;
    }
    return 0
}

export function getEdgeNeighborhoodsPositions(positionLike: Vector2DLike) {
    const position = Vector2D.from(positionLike)
    switch (getEdgeAnge(position)) {
        case 0:
            return [
                position.added(new Vector2D(0, 3)),
                position.added(new Vector2D(0, -3)),
                position.added(new Vector2D(-3, 3)),
                position.added(new Vector2D(3, -3)),
            ]
        case 60:
            return [
                position.added(new Vector2D(-3, 3)),
                position.added(new Vector2D(3, -3)),
                position.added(new Vector2D(3, 0)),
                position.added(new Vector2D(-3, 0)),
            ]
        case -60:
            return [
                position.added(new Vector2D(3, 0)),
                position.added(new Vector2D(-3, 0)),
                position.added(new Vector2D(0, 3)),
                position.added(new Vector2D(0, -3)),
            ]
        default:
            return []
    }
}

export function getEdgeHexesPositions(edgePosition: Vector2DLike) {
    var position = Vector2D.from(edgePosition)
    switch (getEdgeAnge(position)) {
        case 0:
            return [
                position.added(new Vector2D(-3, 0)),
                position.added(new Vector2D(3, 0)),
            ]
        case -60:
            return [
                position.added(new Vector2D(3, -3)),
                position.added(new Vector2D(-3, 3)),
            ]
        case 60:
            return [
                position.added(new Vector2D(0, -3)),
                position.added(new Vector2D(0, 3)),
            ]
        default:
            return []
    }
}

export function getEdgeVerticesPositions(positionLike: Vector2DLike): Vector2D[] {
    const position = Vector2D.from(positionLike)
    switch (getEdgeAnge(position)) {
        case 0:
            return [
                position.added(new Vector2D(-1, 2)),
                position.added(new Vector2D(1, -2)),
            ]
        case -60:
            return [
                position.added(new Vector2D(-1, -1)),
                position.added(new Vector2D(1, 1)),
            ]
        case 60:
            return [
                position.added(new Vector2D(2, -1)),
                position.added(new Vector2D(-2, 1)),
            ]
        default:
            return []
    }
}

export function hexagonFlat(): Vector2D[] {
    return range(6)
        .map(i => Math.PI / 3 * i)
        .map(angle => Vector2D.atAngle(angle))
}

export function hexagon(): Vector2D[] {
    return range(6)
        .map(i => Math.PI / 3 * i + Math.PI / 6)
        .map(angle => Vector2D.atAngle(angle))
}

export function hexagonSized(size: number): Vector2D[] {
    return hexagon().map(v => v.multiplied(size))
}

export function vectorArrayToString(array: Vector2D[]): string {
    return array.map(v => `${v.x}, ${v.y}`)
        .join(' ')
}

export function hexagonString(size: number): string {
    return vectorArrayToString(hexagonSized(size))
}

export class Vector2DArray<T> {
    array: T[][] = []

    add(pos: Vector2DLike, element: T) {
        let row = this.array[pos.y]
        if (!row) {
            row = []
            this.array[pos.y] = row
        }
        row[pos.x] = element
    }

    get(pos: Vector2DLike) {
        const row = this.array[pos.y]
        if (!row) {
            return undefined
        }
        return row[pos.x]
    }
}

export function toCoordsArray<T extends PositionData>(dataList: T[]): Vector2DArray<T> {
    const result = new Vector2DArray<T>()
    dataList.forEach(data => {
        result.add(data.position, data)
    })
    return result
}

export function findByCoords<T extends PositionData>(coords: Vector2DLike[], dataArray: Vector2DArray<T>): T[] {
    return coords.map(coord => {
        return dataArray.get(coord)
    })
        .filter(data => data != undefined)
}

export function findByCoordsArray<T extends PositionData>(coords: Vector2DLike[], dataArray: T[]): T[] {
    return coords.map(coord => {
        return dataArray.find(el => Vector2D.equals(el.position, coord))
    }).filter(data => data != undefined)
}


export function findAddOrReplaceByCoords<T extends PositionData>(newData: T, dataArray: T[]) {
    const index = dataArray.findIndex(data => Vector2D.equals(data.position, newData.position))
    if (index < 0) {
        dataArray.push(newData)
        return index
    }
    dataArray[index] = newData
    return index
}

export function getMinMax(hexes: HexData[], hexSize: number) {
    const hexPositions = hexes.map(hex => pointyHexToPixel(hex.position, hexSize).multiplied(1 / 6))
    const xList = hexPositions.map(pos => pos.x)
    const yList = hexPositions.map(pos => pos.y)
    return {
        min: new Vector2D(Math.min(...xList), Math.min(...yList)),
        max: new Vector2D(Math.max(...xList), Math.max(...yList))
    }
}