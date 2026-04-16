export type Prop = string | symbol
export type PropPath = Prop[]
export interface PropChange {
    path: PropPath,
    value: any
}

export function getSubObjectChanges(changes: PropChange[], begining: Prop[]): PropChange[] {
    return changes.filter(change => {
        if (change.path.length < begining.length) {
            return false
        }
        for (let i = 0; i < begining.length; i++) {
            if (change.path[i] != begining[i]) {
                return false
            }
        }
        return true
    }).map(change => {
        const newChange: PropChange = {
            path: change.path.slice(begining.length),
            value: change.value
        }
        return newChange
    })
}

export function watchChagesList<T extends object>(target: T, changeList: PropChange[], path: PropPath = []): T {
    return createDeepProxy(target, (change) => changeList.push(change), path)
}

export function createDeepProxy<T extends object>(target: T, callback: (change: PropChange) => void, path: PropPath = []): T {
    const proxyCache = new WeakMap();
    return new Proxy(
        target, {
        get(target, property) {
            const item = Reflect.get(target, property)

            if (item && (typeof item === 'object' || Array.isArray(item))) {
                if (proxyCache.has(item)) return proxyCache.get(item);

                const proxy = createDeepProxy(item, callback, [...path, property]);
                proxyCache.set(item, proxy);
                return proxy;
            }
            return item;
        },
        set(target, property, newValue) {
            const oldVal = Reflect.get(target, property)
            Reflect.set(target, property, newValue)
            const fullPath = [...path, property] as PropPath
            if (oldVal != newValue) {
                callback({ path: fullPath, value: newValue });
            }
            return true;
        }
    });
}