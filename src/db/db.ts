import { openDB } from 'idb'
import type BoardgameDBSchema from './schema';
import type Game from './game';
import type { GameState } from './gameState';

const version = 1

const db = await openDB<BoardgameDBSchema>('boardgame-p2p', version, {
    upgrade(db) {
        db.createObjectStore('games', {
            keyPath: 'id',
        });
        db.createObjectStore('states', {
            keyPath: 'id',
        });
    },
})

export default {
    updateGame(game: Game) {
        return db.put('games', game)
    },

    deleteGame(id: string) {
        return db.delete('games', id)
    },

    getAllGames() {
        return db.getAll('games')
    },

    getGame(id: string) {
        return db.get('games', id).then(game => {
            if (game) {
                game.players.forEach(player => player.online = false)
            }
            return game
        })
    },
    updateGameState(gameState: GameState) {
        db.put('states', gameState)
    },
    getGameState(id: string) {
        return db.get('states', id)
    }
};