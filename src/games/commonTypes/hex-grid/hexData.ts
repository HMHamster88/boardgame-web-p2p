import { type Vector2DLike } from "../vector2d"

export interface PositionData {
    position: Vector2DLike
}

export interface HexData extends PositionData {
}

export interface VertexData extends PositionData {
}

export interface EdgeData extends PositionData {
}

export interface HexGridData {
    hexes: HexData[],
    vertices: VertexData[],
    edges: EdgeData[]
}

export function distinct<T>(array: T[], keySelector: (obj: T) => any): T[] {
    const seen = new Set<string>();
    return array.filter(item => {
        const key = keySelector(item)
        if (!seen.has(key)) {
            seen.add(key);
            return true;
        }
        return false;
    });
}

export function distinctByPosition<T extends PositionData>(array: T[]) {
    return distinct(array, data => data.position.toString())
}