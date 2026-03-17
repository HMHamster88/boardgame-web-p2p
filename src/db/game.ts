import type { Player } from "./player";

export enum GameType {
    TIC_TAC_TOE = "TIC_TAC_TOE",
    CATAN = "CATAN",
}

export enum GameStatusEnum {
    CREATED = "CREATED",
    STARTED = "STARTED",
    FINISHED = "FINISHED",
}


export interface CrateGameProps {
    name: string;
    type: GameType;
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
    type: GameType
    players: Player[]
    status: GameStatusEnum
    settings: GameSettings
    created: Date
}