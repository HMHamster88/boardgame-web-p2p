<template>
    <g :transform="transform" @click="emit('click', data)">
        <polygon :points="hexagonString(size)" :fill="`url(#${data.type})`" class="hex">
        </polygon>
        <text v-if="data.circularNumber" :class="curcularTextClass">
            {{ data.circularNumber }}
        </text>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { hexagonString, pointyHexToPixel } from '../../commonTypes/hex-grid/geometry.ts'
import type { CatanTerrainHex } from '../types/types.ts'

const curcularTextClass = computed(() => {
    return {
        'circular-number-text': true,
        'highlight': props.allDiceValue == props.data.circularNumber
    }
})

const position = computed(() => {
    return pointyHexToPixel(props.data.position, props.size).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y})`
})

const props = defineProps({
    data: {
        type: Object as PropType<CatanTerrainHex>,
        required: true
    },
    size: {
        type: Number,
        default: 20
    },
    allDiceValue: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits({
    click(_data: CatanTerrainHex) {
        return true
    }
})

</script>

<style scoped>
.circular-number-text {
    font-size: 32px;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
    paint-order: stroke;
    fill: white;
    stroke: #000000;
    stroke-width: 3px;
    stroke-linecap: butt;
    stroke-linejoin: miter;
}

.highlight {
    fill: rgb(84, 253, 0);
}

.hex {}

.hex:hover {
    filter: hue-rotate(45deg);
}
</style>