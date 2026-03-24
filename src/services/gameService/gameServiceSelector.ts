import type { GameService } from "./gameService"

interface GameModule {
    getService: () => GameService;
}

async function loadModules() {
    const modules = import.meta.glob<GameModule>('../../games/**/*Service.ts', {
        eager: false
    });

    const loadedModules = await Promise.all(
        Object.entries(modules).map(async ([_path, importModule]) => {
            const module = await importModule();
            return module;
        })
    );

    return loadedModules;
}

const gameModiles = await loadModules();

const gameServices = new Map<string, GameService>(gameModiles.map((module) => {
    const gameService = module.getService()
    return [gameService.gameType, gameService]
}))

export const allGameServicesTypes = Array.from(gameServices.keys())

export const allGameServices = Array.from(gameServices.values())

function getGameSerivce(gameType: string): GameService {
    return gameServices.get(gameType)!
}

export default getGameSerivce
