<template>
    <g :transform="transform" @click="emit('click', data)">
        <rect class="road-highlight" rx="5" ry="5" :width="hexSize / 4" :y="-hexSize / 2" :height="hexSize"
            :x="-hexSize / 8" />
    </g>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { getEdgeAnge, pointyHexToPixel } from '../../commonTypes/hex-grid/geometry';
import { Vector2D } from '../../commonTypes/vector2d';

const position = computed(() => {
    return pointyHexToPixel(props.data, props.hexSize).multiplied(1 / 6)
})

const transform = computed(() => {
    return `translate(${position.value.x}, ${position.value.y}) rotate(${getEdgeAnge(props.data)})`
})

const props = defineProps({
    data: {
        type: Object as PropType<Vector2D>,
        required: true
    },
    hexSize: {
        type: Number,
        required: true
    }
})

const emit = defineEmits({
    click(_data: Vector2D) {
        return true
    },
})

</script>

<style scoped>
.road-highlight {
    fill: #51ff0000;
    transition: fill 0.1s ease-in-out, color 0.1s ease-in-out;
    cursor: pointer;
}

.road-highlight:hover {
    fill: #51ff008b;
}
</style>