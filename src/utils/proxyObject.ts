export type Prop = string | symbol
export type PropPath = Prop[]

export function getSubObjectPaths(paths: PropPath[], begining: Prop[]): PropPath[] {
    return paths.filter(path => {
        if (path.length < begining.length) {
            return false
        }
        for (let i = 0; i < begining.length; i++) {
            if (path[i] != begining[i]) {
                return false
            }
        }
        return true
    }).map(path => path.slice(begining.length) as PropPath)
}

export function createDeepProxy<T extends object>(target: T, callback: (path: PropPath, value: any) => void, path: PropPath = []): T {
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
            Reflect.set(target, property, newValue)
            const fullPath = [...path, property]
            callback(fullPath, newValue);
            return true;
        }
    });
}