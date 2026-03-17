

export function findAndRemoveElement<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => unknown): boolean {
    const index = array.findIndex(predicate)
    if (index < 0) {
        return false
    }
    array.splice(index, 1)
    return true
}

export function removeElement<T>(array: Array<T>, element: T): boolean {
    const index = array.indexOf(element, 0);
    if (index < 0) {
        return false
    }
    array.splice(index, 1)
    return true
}

export function inti2DArray<T>(rows: number, columns: number, defaultValue: T) {
    return Array(rows).fill(defaultValue).map(() => Array(columns).fill(defaultValue))
}