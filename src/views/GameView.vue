<template>
    <Card v-if="game.players" header="Players" class="mb-2">
        {{ game.players.length }}
        <template #content>
            <div class="flex items-center">
                <div class="players-container">
                    <Chip v-for="player, index in game.players" :removable="canKickPlayer(player)"
                        :class="playerClassStyle(player)" v-on:click="playerClick(player)">
                        <div>
                            <div class="flex items-center">
                                <div class="rounded-box" :style="playerColorStyle(player)"></div>
                                <div class="ml-1 mr-1">{{ player.name }}</div>
                                <div :class="{ 'bg-red-500': !player.online, 'bg-green-500': player.online, circle: true }"
                                    v-tooltip="player.online ? 'Online' : 'Offline'"></div>
                                <br>
                            </div>
                            <div v-if="playersPoints && playersPoints[index] != null" style="text-align: center;">
                                {{ t('playerPoints', { points: playersPoints[index] }) }}</div>
                        </div>
                        <template #removeicon="">
                            <i class="pi pi-times-circle p-chip-remove-icon" @click="kickPlayer(player)" />
                        </template>
                    </Chip>
                </div>
                <div class="mr-auto"></div>
                <Badge class="mr-2" :severity="connectStatusSeverity">{{ connectStatusText }}</Badge>
                <Button v-on:click="join" v-if="canJoin">{{ t('join') }}</Button>
                <Button icon="pi pi-cog" v-on:click="editPlayer" v-if="!canJoin"></Button>
            </div>
        </template>
    </Card>
    <PlayerEditDialog ref="playerEditDialog"> </PlayerEditDialog>

    <Card v-if="showGameSetting" name="settings">
        <template #title>{{ t('gameSettings') }}</template>
        <template #content>
            <component :is="settingsComponent" class="tab" :settings="game.settings" @performAction="peformGameAction"
                :canEdit="isGameOwner">
            </component>
        </template>
        <template #footer>
            <Button @click="startGame" v-if="isGameOwner">{{ t('startGame') }}</Button>
        </template>
    </Card>

    <Card v-if="showGameView && game.status == GameStatusEnum.FINISHED" class="mb-2">
        <template #title>
            {{ t('gameFinished') }}
        </template>
        <template #content>

            <p>{{ t('winners') }}</p>
            <span v-for="player in winners">{{ player.name }}</span>
        </template>
    </Card>

    <Card v-if="showGameView">
        <template #content>
            <component v-if="gameState" :is="gameViewComponent" :game="game" :gameState="gameState"
                :playerPrivateState="playerPrivateState" :localPlayerIndex="localPlayerIndex" ref="gameView"
                @performAction="peformGameAction">

            </component>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { onBeforeRouteLeave, useRoute } from 'vue-router';

import emitter from '../utils/eventBus'
import { useLocalStore } from '../services/localStore'
import type Game from '../db/game';

import { GameStatusEnum } from '../db/game';
import type { PlayerPrivateState, GamePublicState } from '../db/gameState';
import type { Player } from '../db/player';
import GameClient, { ConnectStatus } from '../services/gameClient';
import GameHost from '../services/gameHost';
import getGameSerivce from '../services/gameService/gameServiceSelector';
import type { GameService } from '../services/gameService/gameService';
import type { GameAction } from '../services/messages';
import { useI18n } from 'vue-i18n';
import { soundService } from '../services/soundService';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            playerPoints: 'Points: {points}',
            connecting: 'Connecting...',
            connected: 'Connected',
            disconnected: 'Disconnected',
            join: 'Join',
            gameSettings: 'Game Settings',
            startGame: 'Start Game',
            gameFinished: 'Game Finished',
            winners: 'Winners:',
            yourTurn: 'Your turn'
        },
        ru: {
            playerPoints: 'Очки: {points}',
            connecting: 'Подключение...',
            connected: 'Подключено',
            disconnected: 'Отключено',
            join: 'Присоединиться',
            gameSettings: 'Настройки Игры',
            startGame: 'Начать игру',
            gameFinished: 'Игра Закончена',
            winners: 'Победители:',
            yourTurn: 'Ваш ход'
        }
    }
})

const route = useRoute()
const localStore = useLocalStore();

const gameId = route.params['id'] as string
const gameHost = new GameHost(gameId)
const gameClient = new GameClient(gameId, localStore.user.id)
const game = ref<Game>({ id: '', name: '', owner: '', players: [], status: GameStatusEnum.CREATED, type: '', settings: { minPlayers: 2, maxPlayers: 2 }, created: new Date() } as Game)
const gameState = ref<GamePublicState | undefined>(undefined)


const playerPrivateState = ref<PlayerPrivateState>({
    playerId: localStore.user.id
})

const playersPoints = computed(() => {
    if (!gameState.value) {
        return
    }
    return game.value.players.map(player => {
        return gameState.value?.playersStates?.find(pl => pl.playerId == player.userId)?.points
    })
})

const playerEditDialog = useTemplateRef('playerEditDialog')

const connectStatusText = ref('Connecting...')
const connectStatusSeverity = ref('warn')

let gameService: GameService

watch(gameState, (newValue) => {
    if (!newValue) {
        return
    }
    if (newValue.activePlayerIndex == localPlayerIndex.value && game.value.status == GameStatusEnum.STARTED) {
        emitter.emit('toastMessage', { severity: 'info', summary: t('yourTurn'), life: 1000 })
        soundService.notification()
    }
})

function playerClassStyle(player: Player) {
    return {
        "player": true,
        "active-player": player == activePlayer.value
    }
}

const gameViewComponent = computed(() => {
    if (!gameState.value) {
        return null
    }
    return gameService.gameViewComponent
})

const showGameView = computed(() => {
    return game.value.type && game.value.status == GameStatusEnum.STARTED || game.value.status == GameStatusEnum.FINISHED
})

const winners = computed(() => {
    if (!gameState.value) {
        return []
    }
    return game.value.players.filter(player => gameState.value?.winnersIds.includes(player.userId))
})

const settingsComponent = computed(() => {
    if (!game.value.type || !gameService) {
        return null
    }
    return gameService.settingsComponent
})

const localPlayerIndex = computed(() => {
    return game.value.players.indexOf(localPlayer.value!)
})

const activePlayer = computed(() => {
    if (gameState.value?.activePlayerIndex == null) {
        return null
    }
    return game.value.players[gameState.value.activePlayerIndex]
})

const canJoin = computed(() => {
    return game.value.players.length < game.value.settings.maxPlayers && !localPlayer.value && game.value.status == GameStatusEnum.CREATED
})

const isGameOwner = computed(() => {
    return game.value.owner == localStore.user.id
})

const showGameSetting = computed(() => {
    return game.value.type && game.value.status == GameStatusEnum.CREATED
})

function playerColorStyle(player: Player) {
    return {
        'background-color': player.color
    }
}

function peformGameAction(message: GameAction) {
    gameClient.performGameAction(message)
}

function startGame() {
    gameClient.startGame()
}

function canKickPlayer(player: Player): boolean {
    return (player.userId == localStore.user.id || game.value.owner == localStore.user.id) && game.value.status == GameStatusEnum.CREATED
}

function kickPlayer(player: Player) {
    emitter.emit('confirm', {
        title: 'Kick Player',
        message: `Kick "${player.name}" player?`,
        closed: async (result: boolean) => {
            if (!result) {
                return
            }
            gameClient.kickPlayer(player.userId)
        }
    })
}


const localPlayer = computed(() => {
    return game.value.players.find(player => player.userId == localStore.user.id)
})


async function editPlayer() {
    const player = localPlayer.value
    try {
        const newPlayerProps = await playerEditDialog.value.open(player)
        gameClient.updatePlayer(newPlayerProps.name, newPlayerProps.color)
        console.log(newPlayerProps)
    } catch {
    }
}

function join() {
    gameClient.join(localStore.user.name, localStore.user.color);
}

onBeforeUnmount(() => {
    gameClient.close()
})

onMounted(async () => {
    await gameHost.start()
    gameClient.on('connectStatusChanged', (status) => {
        switch (status) {
            case ConnectStatus.CONNECTED:
                connectStatusText.value = t('connected')
                connectStatusSeverity.value = 'success'
                break
            case ConnectStatus.CONNECTING:
                connectStatusText.value = t('connecting')
                connectStatusSeverity.value = 'warn'
                break
            case ConnectStatus.DISCONNECTED:
                connectStatusText.value = t('disconnected')
                connectStatusSeverity.value = 'danger'
                break
        }
    })

    gameClient.on("ErorrGameMessage", (message) => {
        emitter.emit('toastMessage', { severity: 'error', summary: t(message.message, message.messageParams), life: 3000 })
    })

    gameClient.on("JoinGameMessage", (message) => {
        console.log("JoinGameMessage")
        game.value.players.push(message.player)
    })

    gameClient.gameObjectSync.valueSetter = (value) => {
        game.value = value
        gameService = getGameSerivce(game.value.type)
        watch(game.value.settings, () => {
            if (!gameClient.gameObjectSync.updateReceived) {
                gameClient.gameObjectSync.sendUpdate('settings')
            }
            gameClient.gameObjectSync.updateReceived = false
        })
        return game.value
    }

    gameClient.gamePublicStateSync.valueSetter = (value) => {
        gameState.value = value
        return gameState.value
    }

    gameClient.playerPrivateStateSync.valueSetter = (value) => {
        playerPrivateState.value = value
        return playerPrivateState.value
    }

    await gameClient.start()
})

function playerClick(player: Player) {
    player.online = !player.online
}

onBeforeRouteLeave(() => {
    gameClient.close();
    gameHost.close();
})

</script>

<style scoped>
.players-container {
    gap: 1rem;
}

.active-player {
    border: solid;
    border-color: rgb(0, 123, 255);
}

.player {
    border-radius: 8px;
    margin: 0.2rem;
}
</style>