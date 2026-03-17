<template>
    <Card class="card">
        <template #title>Local Games</template>
        <template #content>
            <DataView :value="games">
                <template #list="slotProps">
                    <div class="flex flex-col">
                        <div v-for="(game, index) in slotProps.items" :key="index">
                            <div class="flex justify-between mb-2">
                                <label class="flex mr-auto text-gray-900">
                                    <span class="text-lg font-medium">{{ game.name }}</span>
                                </label>
                                <div style=""></div>
                                <Button class="mr-1" as="router-link" :to="'/games/' + game.id">
                                    View
                                </Button>
                                <Button icon="pi pi-times" severity="secondary" @click="deleteGame(game)">

                                </Button>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
            <div class="flex items-center">
                <Button @click="createGame">Create</Button>
            </div>
        </template>
    </Card>
    <CreateGameDialog ref="createGameDialog"></CreateGameDialog>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import type Game from '../db/game';
import getGameSerivce from '../services/gameService/gameServiceSelector';

import emitter from '../utils/eventBus'
import CreateGameDialog from '../components/CreateGameDialog.vue';
import db from '../db/db';


const createGameDialog = useTemplateRef('createGameDialog')

var games = ref<Game[]>([]);

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
        title: 'Delete game',
        message: `Delete "${game.name}" game?`,
        closed: async (result: boolean) => {
            if (!result) {
                return
            }
            await db.deleteGame(game.id)
            loadGames()
        }
    })
}

onMounted(async () => {
    loadGames();
})
</script>
