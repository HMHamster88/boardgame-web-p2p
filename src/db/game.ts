import type { Player } from "./player";

export enum GameStatusEnum {
    CREATED = "CREATED",
    STARTED = "STARTED",
    FINISHED = "FINISHED",
}


export interface CrateGameProps {
    name: string;
    type: string;
    owner: string
}

export interface GameSettings {
    minPlayers: number;
    maxPlayers: number;
}

export default interface Game {
    id: string;
    owner: string
    name: string
    type: string
    players: Player[]
    status: GameStatusEnum
    settings: GameSettings
    created: Date
}
