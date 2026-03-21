<template>
    <div>{{ gameStatusString }}</div>
    <Button v-if="showEmbarkButton" @click="embark" :disabled="!canEmbark">Embark</Button>
    <Button @click="rollDices">Rooll Dices</Button>
    <div v-if="gameState.dices">
        {{ gameState.dices.redDice + ' + ' + gameState.dices.yellowDice + ' = ' + allDiceValue }}
    </div>
    <div class="flex-auto mb-2">
        <CatanHexGrid v-if="gameState.field" :field="gameState.field" @road-overlay-click="roadOverlayClick"
            :players="game.players" @intersection-overlay-click="intersectionOverlayClick"
            :all-dice-value="allDiceValue"></CatanHexGrid>
    </div>
    <div class="resource-cards-container">
        <div v-for="resource in playerPrivateState.resources"
            style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div class="resource-card" :style="resourceCardStyle(resource.type)">

            </div>
            <div>{{ resource.count }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">

import { computed, type PropType, ref } from 'vue';
import CatanHexGrid from './CatanHexGrid.vue';
import { findByCoords, getEdgeNeighborhoodsPositions, getEdgeVerticesPositions, getVertexNeighborhoodsPositions, toCoordsArray } from '../../commonTypes/hex-grid/geometry';
import { Vector2D, type Vector2DLike } from '../../commonTypes/vector2d';
import { CatanGamePhase, CatanIntersectionObjectType, CatanResourceType, type CatanEmbarkAction, type CatanIntersection, type CatanPlayerPrivateState, type CatanPublicGameState, type CatanRoad, type CatanRollDicesAction } from '../types/types';
import type { GameAction } from '../../../services/messages';
import type Game from '../../../db/game';
import { removeElement } from '../../../utils/arrayUtils';
import { resourceCardsImg } from './graphics';

const embarkSettlementsCount = 2
const embarkRoadsCount = 2

interface EmbarkData {
    settlements: CatanIntersection[],
    roads: CatanRoad[]
}

const embarkData = ref<EmbarkData>({
    settlements: [],
    roads: []
})

const allDiceValue = computed(() => {
    return props.gameState.dices.redDice + props.gameState.dices.yellowDice
})

function rollDices() {
    const rollAction: CatanRollDicesAction = {
        type: 'CatanRollDicesAction'
    }
    emit('performAction', rollAction)
}

function resourceCardStyle(resourceType: CatanResourceType) {
    return `background-image: url("${resourceCardsImg[resourceType]}")`
}

const canEmbark = computed(() => {
    return embarkData.value.roads.length == embarkRoadsCount && embarkData.value.settlements.length == embarkSettlementsCount
})

function embark() {
    const embarkAction: CatanEmbarkAction = {
        type: 'CatanEmbarkAction',
        settlements: embarkData.value.settlements.map(settl => settl.position),
        roads: embarkData.value.roads.map(road => road.position)
    }
    emit('performAction', embarkAction)
}

function hasSettlemetOrCity(ins: CatanIntersection, playerId: String) {
    return ins.intersectionObjects.some(obj =>
        (obj.type == CatanIntersectionObjectType.SETTLEMENT ||
            obj.type == CatanIntersectionObjectType.CITY) &&
        obj.playerId == playerId

    )
}

function canBuildRoad(position: Vector2DLike): Boolean {
    var intersections = findByCoords(getEdgeVerticesPositions(position), intersectsByCoords.value)
        .filter(ins => hasSettlemetOrCity(ins, localPlayer.value.userId))
    var roads = findByCoords(getEdgeNeighborhoodsPositions(position), roadsByCoords.value)
        .filter(road => road.playerId == localPlayer.value.userId)
    return intersections.length != 0 || roads.length != 0
}

function roadOverlayClick(position: Vector2D) {
    if (isLocalPlayerTurn.value) {
        if (props.gameState.phase == CatanGamePhase.EMBARK) {
            var road = roadsByCoords.value.get(position)
            if (road) {
                removeElement(props.gameState.field.roads, road)
                removeElement(embarkData.value.roads, road)
                return
            }

            if (embarkData.value.roads.length >= embarkRoadsCount) {
                return
            }

            if (!canBuildRoad(position)) {
                return
            }

            road = {
                playerId: localPlayer.value.userId,
                position: position
            }

            props.gameState.field.roads.push(road)
            embarkData.value.roads.push(road)
        }
    }
}

function checkAndRemoveRoads(): boolean {
    for (let road of embarkData.value.roads) {
        if (!canBuildRoad(road.position)) {
            removeElement(props.gameState.field.roads, road)
            removeElement(embarkData.value.roads, road)
            checkAndRemoveRoads()
            return false
        }
    }

    const roadsWithSettelments = embarkData.value.roads.find(road => {
        const intersections = findByCoords(getEdgeVerticesPositions(road.position), intersectsByCoords.value)
            .filter(ins => hasSettlemetOrCity(ins, localPlayer.value.userId))
        return intersections.length
    })

    if (!roadsWithSettelments) {
        props.gameState.field.roads = []
        embarkData.value.roads = []
        return false
    }

    return true
}

function intersectionOverlayClick(position: Vector2D) {
    if (isLocalPlayerTurn.value) {
        if (props.gameState.phase == CatanGamePhase.EMBARK) {

            const neighborhoods = findByCoords(getVertexNeighborhoodsPositions(position), intersectsByCoords.value)
            const neighbourhoodsOcupated = neighborhoods.some(neighborhood => neighborhood.intersectionObjects.length > 0)
            if (neighbourhoodsOcupated) {
                return
            }

            var intersection: CatanIntersection | undefined = intersectsByCoords.value.get(position)
            if (intersection) {
                removeElement(props.gameState.field.intersections, intersection)
                removeElement(embarkData.value.settlements, intersection)
                checkAndRemoveRoads()

                return
            }

            if (embarkData.value.settlements.length >= embarkSettlementsCount) {
                return
            }

            const settlement = {
                playerId: localPlayer.value.userId,
                type: CatanIntersectionObjectType.SETTLEMENT
            }
            intersection = {
                position: position,
                intersectionObjects: [settlement]
            }

            props.gameState.field.intersections.push(intersection)
            embarkData.value.settlements.push(intersection)
        }
    }
}

const showEmbarkButton = computed(() => {
    return isLocalPlayerTurn.value && props.gameState.phase == CatanGamePhase.EMBARK
})

const intersectsByCoords = computed(() => {
    return toCoordsArray(props.gameState.field.intersections)
})

const roadsByCoords = computed(() => {
    return toCoordsArray(props.gameState.field.roads)
})

const localPlayer = computed(() => {
    return props.game.players[props.localPlayerIndex]!
})

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

const isLocalPlayerTurn = computed(() => {
    return props.localPlayerIndex == props.gameState.activePlayerIndex
})

const activePlayer = computed(() => {
    return props.game.players[props.gameState.activePlayerIndex]!
})

const gameStatusString = computed(() => {
    switch (props.gameState.phase) {
        case CatanGamePhase.EMBARK:
            return `Player "${activePlayer.value.name}" ebark`
        case CatanGamePhase.THROWING_DICE:
            return `Player "${activePlayer.value.name}" throwing dice`
        default:
            return 'Unknonw state'
    }
})

const props = defineProps({
    game: {
        type: Object as PropType<Game>,
        required: true
    },
    gameState: {
        type: Object as PropType<CatanPublicGameState>,
        required: true
    },
    playerPrivateState: {
        type: Object as PropType<CatanPlayerPrivateState>,
        required: true
    },
    localPlayerIndex: {
        type: Number,
        required: true
    }
})

</script>

<style scoped>
.resource-cards-container {
    display: flex;
    overflow: auto;
    width: 100%;
    gap: 1rem;
    padding-bottom: 1rem;
}

.resource-card {
    background: rgb(255, 255, 255);
    background-size: cover;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.307);
    height: 10rem;
    aspect-ratio: 0.65
}

.hand-pointer {
    cursor: pointer;
}

.selected-card {
    border: 3px solid #28ee00;
}
</style>