import _ from "lodash"
import type { Comparable } from "../games/commonTypes/comparable"

export interface Typed<T> {
    type: T
}

export function getByType<K, T extends Typed<K>>(array: Array<T>, type: K): T | undefined {
    return array.find(el => el.type == type)
}

export function randomElement<T>(array: Array<T>): T | undefined {
    if (array.length == 0) {
        return undefined
    }
    return array[_.random(0, array.length - 1)]
}

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

export function initEnumRecord<K extends keyof any, V>(
    keys: Record<K, string | number | symbol>,
    values: Partial<Record<K, V>>,
    defaultValue: V
): Record<K, V> {
    const record = {} as Record<K, V>;
    Object.keys(keys).forEach(keyAny => {
        const key = keyAny as K
        if (values[key]) {
            record[key] = values[key];
        } else {
            record[key] = defaultValue
        }
    });
    return record;
}

export function filterRecord<K extends keyof any, V>(
    record: Record<K, V>,
    filter: (k: K, v: V) => boolean
): Partial<Record<K, V>> {
    const newRecord = {} as Partial<Record<K, V>>;
    Object.keys(record).forEach(keyAny => {
        const key = keyAny as K
        if (filter(key, record[key])) {
            newRecord[key] = record[key]
        }
    });
    return newRecord;
}

export function enumKeys<K extends keyof any>(enumVal: Record<K, string | number | symbol>): K[] {
    return Object.keys(enumVal).map(k => k as K)
}

export function randomEnumVal<K extends keyof any, V extends string | number | symbol>(enumVal: Record<K, V>): V {
    return enumVal[randomElement(enumKeys(enumVal))!]
}

export function recordEntries<K extends keyof any, V>(record: Record<K, V>): [K, V][] {
    return Object.entries(record).map(([k, v]) => [k as K, v as V])
}

export function partialRecordEntries<K extends keyof any, V>(record: Partial<Record<K, V>>): [K, V][] {
    return Object.entries(record).filter(([k, _v]) => k).map(([k, v]) => [k as K, v as V])
}

export function recordValues<K extends keyof any, V>(record: Record<K, V>): V[] {
    return Object.entries(record).map(([_k, v]) => v as V)
}

export function recordKeys<K extends keyof any, V>(record: Record<K, V>): K[] {
    return Object.entries(record).map(([k, _v]) => k as K)
}

export function recordForeach<K extends keyof any, V>(record: Record<K, V>, fun: (key: K, value: V) => void) {
    Object.entries(record).forEach(([k, v]) => fun(k as K, v as V))
}
