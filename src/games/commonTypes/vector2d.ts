import type { Comparable } from "./comparable"

export interface Vector2DLike {
    x: number
    y: number
}

export class Vector2D implements Vector2DLike, Comparable {
    x: number
    y: number

    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }

    static one(): Vector2D {
        return new Vector2D(1, 0)
    }

    static from(vector2d: Vector2DLike) {
        return new Vector2D(vector2d.x, vector2d.y)
    }

    static atAngle(angle: number, length: number = 1): Vector2D {
        return new Vector2D(Math.cos(angle) * length, Math.sin(angle) * length)
    }

    static equals(v1: Vector2DLike | undefined, v2: Vector2DLike | undefined): Boolean {
        if (v1 == v2) {
            return true
        }
        if (v1 == undefined || v2 == undefined) {
            return false
        }
        return v1.x == v2.x && v1.y == v2.y
    }

    multiplied(m: number): Vector2D {
        return new Vector2D(this.x * m, this.y * m)
    }

    added(v: Vector2D): Vector2D {
        return new Vector2D(this.x + v.x, this.y + v.y)
    }

    equals(v: Vector2D) {
        return this.x == v.x && this.y == v.y
    }

    toString() {
        return `${this.x},${this.y}`
    }
}