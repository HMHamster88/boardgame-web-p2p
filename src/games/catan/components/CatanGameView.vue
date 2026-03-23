<template>

    <div class="flex-auto mb-2">
        <CatanHexGrid v-if="gameState.field" :field="gameState.field" @road-overlay-click="roadOverlayClick"
            :players="game.players" @intersection-overlay-click="intersectionOverlayClick"
            :all-dice-value="allDiceValue"></CatanHexGrid>
    </div>
    <div class="flex gap-2 justify-center items-center">
        <Button v-if="showEmbarkButton" @click="embark" :disabled="!canEmbark">Embark</Button>
        <div :class="diceContainerClass" v-on:click="rollDices">
            <Dice color="#ee3232" :result="dices.redDice" :highlight="canRollDices"></Dice>
            <Dice color="#FFFF00" :result="dices.yellowDice"></Dice>
        </div>
        <Button v-on:click="buyClick" :disabled="!canBuy">{{ t('buy') }}</Button>
        <Popover ref="buyMenu">
            <ul class="list-none p-0 m-0 flex flex-col">
                <li v-for="item in buyItems"
                    class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border"
                    :class="{ 'buy-item-dsabled': !canBuyItem(item) }" v-on:click="buyItemClick(item)">
                    <p>{{ t('buyItems.' + item.type) }}</p>
                    <div v-for="resource in getFlatResources(item.resources)" class="flex items-center">
                        <img :src="resourcesImages[resource]" style="width: 24px; height: 24px;" />
                    </div>
                </li>
            </ul>
        </Popover>
        <Button :disabled="!canEndTurn" v-on:click="endTurn()">{{ t('endTurn') }}</Button>
    </div>

    <CatanResourceCards v-if="playerPrivateState && playerPrivateState.resources"
        :resources="playerPrivateState.resources">
    </CatanResourceCards>
</template>

<script setup lang="ts">

import Dice from '../../../components/Dice.vue';

import { computed, type PropType, ref, useTemplateRef } from 'vue';
import CatanHexGrid from './CatanHexGrid.vue';
import { findByCoords, getEdgeNeighborhoodsPositions, getEdgeVerticesPositions, getVertexEdgesPositions, getVertexNeighborhoodsPositions, toCoordsArray } from '../../commonTypes/hex-grid/geometry';
import { Vector2D, type Vector2DLike } from '../../commonTypes/vector2d';
import {
    buyItemToIntersectionObject,
    CatanBuyItemType,
    catanEmbarkPhases,
    CatanGamePhase,
    CatanIntersectionObjectType,
    getBuyItems,
    type CatanBuyItem,
    type CatanDices, type
        CatanIntersection,
    type CatanPlayerPrivateState,
    type CatanPublicGameState,
    type CatanResourceCount,
    type CatanRoad
} from '../types/types';
import type { CatanBuildIntObjectAction, CatanBuildRoadAction, CatanEmbarkAction, CatanEndTurnAction, CatanRollDicesAction } from "../types/actions";
import type { GameAction } from '../../../services/messages';
import type Game from '../../../db/game';
import { rangeArray, removeElement } from '../../../utils/arrayUtils';
import { resourcesImages } from './graphics';
import { useI18n } from 'vue-i18n';
import CatanResourceCards from './CatanResourceCards.vue';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            buy: 'Buy',
            buyItems: {
                'ROAD': 'Road',
                'SETTLEMENT': 'Settelment',
                'CITY': 'City',
                'DEVELOPMENT_CARD': 'Development Card'
            },
            endTurn: 'End Turn'
        },
        ru: {
            buy: 'Купить',
            buyItems: {
                'ROAD': 'Дорога',
                'SETTLEMENT': 'Поселение',
                'CITY': 'Город',
                'DEVELOPMENT_CARD': 'Карта развития'
            },
            endTurn: 'Закончить ход'
        }
    }
})

const buildItemType = ref<CatanBuyItemType | undefined>()

const buyMenu = useTemplateRef('buyMenu')

interface EmbarkData {
    settlement: CatanIntersection | undefined,
    road: CatanRoad | undefined
}

const embarkData = ref<EmbarkData>({
    settlement: undefined,
    road: undefined
})

const buyItems = ref(getBuyItems())

const buyClick = (event: Event) => {
    buyMenu.value?.toggle(event)
}

function buyItemClick(item: CatanBuyItem) {
    if (!canBuyItem(item)) {
        return
    }
    if (item.type == CatanBuyItemType.DEVELOPMENT_CARD) {
        // TODO
    } else {
        buildItemType.value = item.type
    }
    buyMenu.value?.hide()
}

function canBuyItem(item: CatanBuyItem): boolean {
    return item.resources.every(itemResource => {
        const playerResource = props.playerPrivateState.resources.find(res => res.type == itemResource.type)
        if (!playerResource) {
            return false
        }
        return playerResource.count >= itemResource.count
    })
}

function endTurn() {
    if (!canEndTurn.value) {
        return
    }
    performAction<CatanEndTurnAction>({ type: 'CatanEndTurnAction' })
}

const canEndTurn = computed<boolean>(() => {
    return (props.gameState.phase == CatanGamePhase.PLAYER_TURN) && isLocalPlayerTurn.value
})

const canBuy = computed<boolean>(() => {
    return (props.gameState.phase == CatanGamePhase.PLAYER_TURN) && isLocalPlayerTurn.value
})

function getFlatResources(resources: CatanResourceCount[]) {
    return resources.flatMap(resouce => rangeArray(resouce.count).map(_ => resouce.type))
}

const canRollDices = computed<boolean>(() => {
    return (props.gameState.phase == CatanGamePhase.THROWING_DICE) && isLocalPlayerTurn.value
})

const diceContainerClass = computed(() => {
    return {
        'dice-container': true,
        'dices-highlight': canRollDices.value
    }
})

const allDiceValue = computed(() => {
    return props.gameState.dices.redDice + props.gameState.dices.yellowDice
})

const dices = computed<CatanDices>(() => {
    return props.gameState.dices
})

function rollDices() {
    if (!canRollDices.value) {
        return
    }
    performAction<CatanRollDicesAction>({
        type: 'CatanRollDicesAction'
    })
}

const canEmbark = computed(() => {
    return embarkData.value.road && embarkData.value.settlement
})

function embark() {
    performAction<CatanEmbarkAction>({
        type: 'CatanEmbarkAction',
        settlement: embarkData.value.settlement?.position!,
        road: embarkData.value.road?.position!
    })
    embarkData.value.settlement = undefined
    embarkData.value.road = undefined
}

function hasSettlemetOrCity(ins: CatanIntersection, playerId: String) {
    return ins.intersectionObjects.some(obj =>
        (obj.type == CatanIntersectionObjectType.SETTLEMENT ||
            obj.type == CatanIntersectionObjectType.CITY) &&
        obj.playerId == playerId

    )
}

function canBuildRoad(position: Vector2DLike): boolean {
    var intersections = findByCoords(getEdgeVerticesPositions(position), intersectsByCoords.value)
        .filter(ins => hasSettlemetOrCity(ins, localPlayer.value.userId))
    var roads = findByCoords(getEdgeNeighborhoodsPositions(position), roadsByCoords.value)
        .filter(road => road.playerId == localPlayer.value.userId)
    return intersections.length != 0 || roads.length != 0
}

function canEmbarkRoad(position: Vector2DLike): boolean {
    if (!embarkData.value.settlement) {
        return false
    }
    return getEdgeVerticesPositions(position).some(vert => Vector2D.equals(vert, embarkData.value.settlement?.position))
}

function roadOverlayClick(position: Vector2D) {
    if (isLocalPlayerTurn.value) {
        if (catanEmbarkPhases.includes(props.gameState.phase)) {
            let road = roadsByCoords.value.get(position)
            if (road) {
                if (road != embarkData.value.road) {
                    return
                }
                removeElement(props.gameState.field.roads, road)
                embarkData.value.road = undefined
                return
            }

            if (embarkData.value.road) {
                return
            }

            if (!canEmbarkRoad(position)) {
                return
            }

            road = {
                playerId: localPlayer.value.userId,
                position: position
            }

            props.gameState.field.roads.push(road)
            embarkData.value.road = road
        } else if (props.gameState.phase == CatanGamePhase.PLAYER_TURN) {
            if (buildItemType.value == CatanBuyItemType.ROAD) {
                let road = roadsByCoords.value.get(position)
                if (road) {
                    return
                }
                if (!canBuildRoad(position)) {
                    return
                }
                performAction<CatanBuildRoadAction>({
                    type: 'CatanBuildRoadAction',
                    position: position
                })
            }
        }
    }
}

function intersectionOverlayClick(position: Vector2D) {
    if (isLocalPlayerTurn.value) {
        if (catanEmbarkPhases.includes(props.gameState.phase)) {

            const neighborhoods = findByCoords(getVertexNeighborhoodsPositions(position), intersectsByCoords.value)
            const neighbourhoodsOcupated = neighborhoods.some(neighborhood => neighborhood.intersectionObjects.length > 0)
            if (neighbourhoodsOcupated) {
                return
            }

            var intersection: CatanIntersection | undefined = intersectsByCoords.value.get(position)
            if (intersection) {
                if (intersection != embarkData.value.settlement) {
                    return
                }
                if (embarkData.value.road) {
                    if (getVertexEdgesPositions(position).some(pos => Vector2D.equals(pos, embarkData.value.road?.position))) {
                        removeElement(props.gameState.field.roads, embarkData.value.road)
                        embarkData.value.road = undefined
                    }
                }
                removeElement(props.gameState.field.intersections, intersection)
                embarkData.value.settlement = undefined
                return
            }

            if (embarkData.value.settlement) {
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
            embarkData.value.settlement = intersection
        } else if (props.gameState.phase == CatanGamePhase.PLAYER_TURN) {
            if (buildItemType.value) {
                const intObjectType = buyItemToIntersectionObject(buildItemType.value)
                if (!intObjectType) {
                    return
                }

                if (!canBuildIntObject(intObjectType, position, localPlayer.value.userId)) {
                    return
                }

                performAction<CatanBuildIntObjectAction>({
                    type: 'CatanBuildIntObjectAction',
                    position: position,
                    objectType: intObjectType
                })
            }
        }
    }
}

function canBuildIntObject(intObjectType: CatanIntersectionObjectType, position: Vector2DLike, playerId: string): boolean {
    const neighborhoodInts = findByCoords(getVertexNeighborhoodsPositions(position), intersectsByCoords.value)
    const setType = [CatanIntersectionObjectType.CITY, CatanIntersectionObjectType.SETTLEMENT]
    if (setType.includes(intObjectType)) {
        // check have settelment on same hex edge
        if (neighborhoodInts.some(nh => nh.intersectionObjects.some(io => setType.includes(io.type)))) {
            return false
        }
        const int = intersectsByCoords.value.get(position)
        if (int) {
            // check settelment already 
            const hasSettelment = int.intersectionObjects.some(io => io.type == CatanIntersectionObjectType.SETTLEMENT)
            if (intObjectType == CatanIntersectionObjectType.SETTLEMENT && hasSettelment) {
                return false
            }
            if (intObjectType == CatanIntersectionObjectType.CITY && !hasSettelment) {
                return false
            }
        }

        const roads = findByCoords(getVertexEdgesPositions(position), roadsByCoords.value)

        if (intObjectType == CatanIntersectionObjectType.SETTLEMENT) {
            if (!roads.some(road => road.playerId == playerId)) {
                return false
            }
        }
    }

    return true
}

const showEmbarkButton = computed(() => {
    return isLocalPlayerTurn.value && catanEmbarkPhases.includes(props.gameState.phase)
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

function performAction<T extends GameAction>(action: T) {
    emit('performAction', action)
}

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

const isLocalPlayerTurn = computed(() => {
    return props.localPlayerIndex == props.gameState.activePlayerIndex
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

<style scoped src="./catan-game-view.css"></style>