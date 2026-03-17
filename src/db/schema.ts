import type { DBSchema } from 'idb';
import type Game from './game';
import type { GameState } from './gameState';

export default interface BoardgameDBSchema extends DBSchema {
    games: {
        key: string,
        value: Game
    };
    states: {
        key: string,
        value: GameState
    };
}