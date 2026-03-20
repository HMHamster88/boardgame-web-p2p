<template>
    <Card class="card">
        <template #title>{{ t('localGames') }}</template>
        <template #content>
            <DataView :value="games" class="mb-2">
                <template #empty>
                    {{ t('noGames') }}
                </template>
                <template #list="slotProps">
                    <div class="flex flex-col">
                        <div v-for="(game, index) in slotProps.items" :key="index">
                            <div class="flex justify-between mb-2 gap-2">
                                <label class="flex mr-auto text-gray-900">
                                    <span class="text-lg font-medium">{{ game.name }}</span>
                                </label>
                                <div style=""></div>
                                <Button as="router-link" :to="'/games/' + game.id">
                                    {{ t('go') }}
                                </Button>
                                <Button type="button" icon="pi pi-download" @click="saveGameToFile(game)" />
                                <Button icon="pi pi-times" severity="secondary" @click="deleteGame(game)">

                                </Button>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
            <div class="flex items-center gap-2">
                <Button @click="createGame">{{ t('create') }}</Button>
                <Button type="button" icon="pi pi-folder-open" @click="loadGameFromFile" />
            </div>
        </template>
    </Card>

    <Card class="card">
        <template #title>{{ t('hostedGames') }}</template>
        <template #content>
            <DataView :value="gameObserver.games.value">
                <template #empty>
                    {{ t('noGames') }}
                </template>
                <template #list="slotProps">
                    <div class="flex flex-col">
                        <div v-for="(game, index) in slotProps.items" :key="index">
                            <div class="flex justify-between mb-2">
                                <label class="flex mr-auto text-gray-900">
                                    <span class="text-lg font-medium">{{ game.name }}</span>
                                </label>
                                <div style=""></div>
                                <Button class="mr-1" as="router-link" :to="'/games/' + game.id">
                                    {{ t('go') }}
                                </Button>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
        </template>
    </Card>
    <CreateGameDialog ref="createGameDialog"></CreateGameDialog>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import type Game from '../db/game';
import getGameSerivce from '../services/gameService/gameServiceSelector';

import emitter from '../utils/eventBus'
import CreateGameDialog from '../components/CreateGameDialog.vue';
import db from '../db/db';
import GameObserver from '../services/gameObserver';
import { useLocalStore } from '../services/localStore';
import { useI18n } from 'vue-i18n';
import { loadGame, saveGame, type GameFile } from '../utils/fileUtils';
import { v4 as uuidv4 } from 'uuid'

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            localGames: 'Local Games',
            create: 'Create',
            go: 'Go',
            hostedGames: 'Launched games',
            deleteGameTitle: 'Delete Game',
            deleteGameMessage: 'Delete game "{gameName}"?',
            noGames: 'No Games'
        },
        ru: {
            localGames: 'Локальные игры',
            create: 'Создать',
            go: 'Перейти',
            hostedGames: 'Запущенные игры',
            deleteGameTitle: 'Удалить игру',
            deleteGameMessage: 'Удалить игру "{gameName}"?',
            noGames: 'Нет игр'
        }
    }
})

const localStore = useLocalStore();

const gameObserver = new GameObserver(localStore.user.id)

const createGameDialog = useTemplateRef('createGameDialog')

const games = ref<Game[]>([]);

async function loadGames() {
    games.value = (await db.getAllGames());
}

async function createGame() {
    try {
        if (createGameDialog.value) {
            const createGameProps = await createGameDialog.value.open()
            const game = getGameSerivce(createGameProps.type).createGame(createGameProps)
            await db.updateGame(game)
            loadGames();
        }
    } catch { }
}

function deleteGame(game: Game) {
    emitter.emit('confirm', {
        title: t('deleteGameTitle'),
        message: t('deleteGameMessage', { gameName: game.name }),
        closed: async (result: boolean) => {
            if (!result) {
                return
            }
            await db.deleteGame(game.id)
            await db.deleteGameState(game.id)
            loadGames()
        }
    })
}

async function loadGameFromFile() {
    const gameFile = await loadGame()
    gameFile.game.owner = localStore.user.id
    const newId = uuidv4()
    gameFile.game.id = newId
    gameFile.gameState.id = newId
    db.updateGame(gameFile.game)
    db.updateGameState(gameFile.gameState)
    loadGames()
}

async function saveGameToFile(game: Game) {
    const gameFile: GameFile = {
        game: game,
        gameState: (await db.getGameState(game.id))!
    }
    saveGame(gameFile)
}

onMounted(async () => {
    gameObserver.connection.start()
    loadGames();
})

onUnmounted(() => {
    gameObserver.connection.close()
})
</script>
