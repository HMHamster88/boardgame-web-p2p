<template>
    <g :transform="transform" :filter="gFilter">
        <image :href="roadImage" :filter="filter" :x="-hexSize * 0.1" :y="-hexSize * 0.3" :height="hexSize * 0.6" />
        <slot></slot>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { Player } from '../../../db/player.ts';
import { parseColor, rgbToHsl } from '../../../utils/colorUtils.ts';
import { getEdgeAnge, pointyHexToPixel } from '../../commonTypes/hex-grid/geometry.ts';
import { type CatanRoad } from '../types/types.ts';
import { roadImage } from './graphics';

function getHLSColor(obj: CatanRoad) {
    const player = props.players?.find(player => player.userId == obj.playerId)!
    return rgbToHsl(parseColor(player.color)!)
}

const filter = computed(() => {
    const color = getHLSColor(props.data)
    return `hue-rotate(${color.h}deg)`
})

const gFilter = computed(() => {
    if (!props.isLongestRoad) {
        return ''
    }
    return 'drop-shadow(0px 0px 2px #ffffff)'
})

const position = computed(() => {
    return pointyHexToPixel(props.data.position, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y}) rotate(${getEdgeAnge(props.data.position)})`
})

const props = defineProps({
    data: {
        type: Object as PropType<CatanRoad>,
        required: true
    },
    hexSize: {
        type: Number,
        required: true
    },
    players: {
        type: Object as PropType<Array<Player>>,
        required: false
    },
    isLongestRoad: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits({
    click(_data: CatanRoad) {
        return true
    },
})

</script>

<style scoped></style>