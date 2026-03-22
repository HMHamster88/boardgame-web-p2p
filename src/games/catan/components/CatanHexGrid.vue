<template>
    <svg width="100%" height="500" :viewBox="computedViewBox" preserveAspectRatio="xMidYMid meet" class="grid"
        version="1.1" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern v-for="image in terrainImages" :id="image.type" patternUnits="userSpaceOnUse" :x="-hexSize"
                :y="-hexSize" :width="hexSize * 2" :height="hexSize * 2">
                <image :href="image.img" x="0" y="0" :width="hexSize * 2" :height="hexSize * 2" />
            </pattern>
        </defs>
        <polygon :points="backgroundHexString" class="water">
        </polygon>
        <g id="trrain">
            <CatanTerrainHexComponent v-for="terrainHex in field.hexes" :data="terrainHex" :size="hexSize"
                :allDiceValue="allDiceValue">
            </CatanTerrainHexComponent>
        </g>

        <g id="harbours">
            <CatanHarbourComponent v-for="harbour in field.harbours" :data="harbour" :hexSize="hexSize"
                :outEdgeRotation="outEdgeRotation(harbour)">
            </CatanHarbourComponent>
        </g>

        <g id="roads">
            <CatanRoadComponent v-for="road in field.roads" :data="road" :hexSize="hexSize" :players="players">
            </CatanRoadComponent>
        </g>

        <g id="intersections">
            <CatanIntersectionComponent v-for="intersection in field.intersections" :data="intersection"
                :hexSize="hexSize" :players="players">
            </CatanIntersectionComponent>
        </g>

        <g id="edgeOverlay">
            <CatanEdgeOverlay v-for="edge in edges" :data="edge" :hexSize="hexSize" @click="roadOverlayClick">
            </CatanEdgeOverlay>
        </g>
        <g id="vertexOverlay">
            <CatanVertexOverlay v-for="vertex in vertices" :data="vertex" :hexSize="hexSize"
                @click="intersectionOverlayClick">
            </CatanVertexOverlay>
        </g>

    </svg>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import {
    findByCoords,
    getEdgeHexesPositions,
    getHexEdgesPositions,
    getHexVerticesPositions,
    getMinMax,
    hexagonFlat,
    pointyHexToPixel,
    toCoordsArray,
    vectorArrayToString
} from '../../commonTypes/hex-grid/geometry.ts';

import { terrainImages } from './graphics.ts';
import CatanRoadComponent from './CatanRoadComponent.vue';
import CatanIntersectionComponent from './CatanIntersectionComponent.vue';

import CatanTerrainHexComponent from './CatanTerrainHexComponent.vue';
import CatanHarbourComponent from './CatanHarbourComponent.vue';
import CatanVertexOverlay from './CatanVertexOverlay.vue';
import CatanEdgeOverlay from './CatanEdgeOverlay.vue';
import type { CatanField, CatanHarbour } from '../types/types.ts';
import type { Player } from '../../../db/player.ts';
import { Vector2D } from '../../commonTypes/vector2d.ts';
import { distinct, type HexGridData } from '../../commonTypes/hex-grid/hexData.ts';

const backgroundHexString = computed(() => {
    if (!hexGridData.value.hexes.length) {
        return ''
    }
    const minMax = getMinMax(hexGridData.value.hexes, props.hexSize)
    const center = new Vector2D(minMax.min.x + minMax.max.x, minMax.min.y + minMax.max.y).multiplied(0.5)
    const size = (minMax.max.x - minMax.min.x + props.hexSize * 4) / 2 + 10
    return vectorArrayToString(hexagonFlat().map(v => v.multiplied(size).added(center)))
})

function outEdgeRotation(data: CatanHarbour) {
    const hexesPositions = getEdgeHexesPositions(data.position)
    const hexes = findByCoords(hexesPositions, hexesByCoords.value)
    if (hexes.length != 1) {
        return 0;
    }
    return (pointyHexToPixel(data.position, props.hexSize).x < pointyHexToPixel(hexes[0]!.position, props.hexSize).x) ? 180 : 0
}

function roadOverlayClick(road: Vector2D) {
    emit('roadOverlayClick', road)
}

function intersectionOverlayClick(position: Vector2D) {
    emit('intersectionOverlayClick', position)
}

const hexesByCoords = computed(() => {
    return toCoordsArray(props.field.hexes)
})

const vertices = computed(() => {
    return distinct(props.field.hexes.flatMap(hex => getHexVerticesPositions(hex.position)), v => v.toString())
})

const edges = computed(() => {
    return distinct(props.field.hexes.flatMap(hex => getHexEdgesPositions(hex.position)), v => v.toString())
})

const hexGridData = computed(() => {
    const data: HexGridData = {
        hexes: props.field.hexes,
        edges: props.field.roads,
        vertices: props.field.intersections
    }
    return data
})

const computedViewBox = computed(() => {
    if (!props.field || !props.field.hexes || !props.field.hexes.length) {
        return '-120 -120 240 240'
    }
    const hexes = props.field.hexes
    const hexSize = props.hexSize
    const minMax = getMinMax(hexes, hexSize)
    minMax.min = minMax.min.added(new Vector2D(-props.hexSize, -props.hexSize)).added(new Vector2D(-props.viewBoxMargin, -props.viewBoxMargin))
    minMax.max = minMax.max.added(new Vector2D(props.hexSize, props.hexSize)).added(new Vector2D(props.viewBoxMargin, props.viewBoxMargin))
    const width = minMax.max.x - minMax.min.x
    const height = minMax.max.y - minMax.min.y
    return `${minMax.min.x} ${minMax.min.y} ${width} ${height}`
})

const props = defineProps({
    field: {
        type: Object as PropType<CatanField>,
        required: true
    },
    hexSize: {
        type: Number,
        default: 60
    },
    players: {
        type: Object as PropType<Array<Player>>,
        required: false
    },
    viewBoxMargin: {
        type: Number,
        default: 80
    },
    allDiceValue: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits({
    intersectionOverlayClick(_position: Vector2D) {
        return true
    },
    roadOverlayClick(_position: Vector2D) {
        return true
    }
})

</script>

<style scoped>
.water {
    fill: #3B90C7;
}
</style>