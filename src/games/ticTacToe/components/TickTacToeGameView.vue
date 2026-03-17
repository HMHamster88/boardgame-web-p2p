<template>
    <div>
        <div v-for="(row, y) in gameState.field" class="flex align-middle justify-center">
            <div v-for="(cell, x) in row" :class="cellClass(cell)" v-on:click="cellClick(x, y)">
                <i :class="cellIconClass(cell)"></i>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { TicTacToeGameStateFieldEnum, type TicTacToeGamePublicState, type TicTacToeSetCellAction } from '../types';
import type { GameAction } from '../../../services/messages';
import type Game from '../../../db/game';
import { GameStatusEnum } from '../../../db/game';


function cellClass(cell: TicTacToeGameStateFieldEnum) {
    return {
        "tic-tac-toe-cell": true,
        "pointer-cursor": cell == TicTacToeGameStateFieldEnum.NONE && isLocalPlayerTurn.value && porps.game.status == GameStatusEnum.STARTED
    }
}

function cellIconClass(cell: TicTacToeGameStateFieldEnum) {
    return {
        "pi": true,
        "pi-times": cell == TicTacToeGameStateFieldEnum.CROSS,
        "pi-circle": cell == TicTacToeGameStateFieldEnum.ZERO
    }
}

function cellClick(x: number, y: number) {
    if (!porps.gameState || !porps.gameState.field || porps.game.status != GameStatusEnum.STARTED) {
        return
    }
    if (!isLocalPlayerTurn.value || porps.gameState.field[y]![x] != TicTacToeGameStateFieldEnum.NONE) {
        return
    }
    console.log(`x: ${x} y: ${y}`)
    const action: TicTacToeSetCellAction = {
        type: 'TicTacToeSetCellAction',
        x: x,
        y: y
    }
    emit('performAction', action)
}

const isLocalPlayerTurn = computed(() => {
    return porps.localPlayerIndex == porps.gameState.activePlayerIndex
})

const porps = defineProps({
    game: {
        type: Object as PropType<Game>,
        required: true
    },
    gameState: {
        type: Object as PropType<TicTacToeGamePublicState>,
        required: true
    },
    localPlayerIndex: {
        type: Number,
        required: true
    }
})

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()
</script>

<style>
.tic-tac-toe-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #00000000;
    width: 2rem;
    height: 2rem;
    border-radius: 0.3rem;
    margin: 0.2rem;
    border: solid;

}

.pointer-cursor {
    cursor: pointer;
}
</style>