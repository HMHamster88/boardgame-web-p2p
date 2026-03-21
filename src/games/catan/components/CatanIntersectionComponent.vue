<template>
    <g :transform="transform">
        <image v-for="obj in data.intersectionObjects" :href="intersectionObjectsImages.get(obj.type)" :x="-size / 2"
            :filter="getFilter(obj)" :y="-size / 2" :width="size">
        </image>
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import { intersectionObjectsImages } from './graphics'
import { pointyHexToPixel } from '../../commonTypes/hex-grid/geometry';
import type { CatanIntersection, CatanIntersectionObject } from '../types/types';
import { parseColor, rgbToHsl } from '../../../utils/colorUtils';
import type { Player } from '../../../db/player';


const position = computed(() => {
    return pointyHexToPixel(props.data.position, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y})`
})

function getHLSColor(obj: CatanIntersectionObject) {
    const player = props.players?.find(player => player.userId == obj.playerId)!
    return rgbToHsl(parseColor(player.color)!)
}

function getFilter(obj: CatanIntersectionObject) {
    const color = getHLSColor(obj)
    return `hue-rotate(${color.h}deg)`
}

const size = computed(() => {
    return props.hexSize / 2
})

const props = defineProps({
    data: {
        type: Object as PropType<CatanIntersection>,
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
    click(_data: CatanIntersection) {
        return true
    },
})
</script>


<style scoped></style>