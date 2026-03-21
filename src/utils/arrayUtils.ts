import type { Comparable } from "../games/commonTypes/comparable"

export function findAndRemoveElement<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => unknown): boolean {
    const index = array.findIndex(predicate)
    if (index < 0) {
        return false
    }
    array.splice(index, 1)
    return true
}

export function rangeArray(length: number) {
    return Array.from({ length: length }, (_, i) => i)
}

export function removeElements<T>(array: Array<T>, elements: T[]) {
    elements.forEach(element => removeElement(array, element))
}

export function removeElement<T>(array: Array<T>, element: T): boolean {
    const index = array.indexOf(element, 0);
    if (index < 0) {
        return false
    }
    array.splice(index, 1)
    return true
}

export function removeCopmarableElements<T extends Comparable>(array: Array<T>, elements: T[]) {
    elements.forEach(el => removeCopmarableElement(array, el))
}

export function removeCopmarableElement<T extends Comparable>(array: Array<T>, element: T): boolean {
    const index = array.findIndex(el => el.equals(element))
    if (index < 0) {
        return false
    }
    array.splice(index, 1)
    return true
}

export function recordAsArray<K extends keyof any, T>(record: Record<K, T>): [K, T][] {
    return Object.entries(record).map(([key, value]) => {
        const element: [K, T] = [key as K, value as T]
        return element
    })
}

export function inti2DArray<T>(rows: number, columns: number, defaultValue: T) {
    return Array(rows).fill(defaultValue).map(() => Array(columns).fill(defaultValue))
}

export function getShuffledArray<T>(array: T[]): T[] {
    const newArr = [...array]; // Create a shallow copy
    let currentIndex = newArr.length;
    let randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArr[currentIndex], newArr[randomIndex]] = [newArr[randomIndex]!, newArr[currentIndex]!];
    }

    return newArr;
};
