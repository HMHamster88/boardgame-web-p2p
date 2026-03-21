<template>
    <g :transform="transform">
        <image :href="roadImage" :filter="getFilter(data)" :x="-hexSize * 0.1" :y="-hexSize * 0.3"
            :height="hexSize * 0.6" />
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { type CatanRoad } from '../types/types.ts';
import { roadImage } from './graphics';
import { getEdgeAnge, pointyHexToPixel } from '../../commonTypes/hex-grid/geometry.ts'
import { parseColor, rgbToHsl } from '../../../utils/colorUtils.ts';
import type { Player } from '../../../db/player.ts';

function getHLSColor(obj: CatanRoad) {
    const player = props.players?.find(player => player.userId == obj.playerId)!
    return rgbToHsl(parseColor(player.color)!)
}

function getFilter(obj: CatanRoad) {
    const color = getHLSColor(obj)
    return `hue-rotate(${color.h}deg)`
}

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
    }
})

const emit = defineEmits({
    click(_data: CatanRoad) {
        return true
    },
})

</script>

<style scoped></style>