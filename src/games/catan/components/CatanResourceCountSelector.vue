<template>
    <div class="flex gap-1 items-center">
        <Button icon="pi pi-minus" v-on:click="decrease()" :disabled="!cadDecrease"></Button>
        <img class="resource-icon" :src="resourcesImages[resourceType]">
        </img>
        <span class="m-1">{{ available ? `${model}/${available}` : model }}</span>
        <Button icon="pi pi-plus" v-on:click="increase()" :disabled="!canIncrease"></Button>
    </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { CatanResourceType } from '../types/types';
import { resourcesImages } from './graphics';

const model = defineModel({ default: 0 })

const canIncrease = computed(() => {
    return model.value <= props.max - props.step
})

const cadDecrease = computed(() => {
    return model.value >= props.min + props.step
})

function increase() {
    if (model.value < props.max - props.step + 1) {
        model.value += props.step
    }
}

function decrease() {
    if (model.value > props.min) {
        if (model.value <= props.step) {
            model.value = 0
        } else {
            model.value -= props.step
        }
    }
}

const props = defineProps({
    resourceType: {
        type: String as PropType<CatanResourceType>,
        required: true
    },
    min: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 100
    },
    step: {
        type: Number,
        default: 1
    },
    available: {
        type: Number
    }
})
</script>

<style scoped>
.resource-icon {
    width: 2rem;
    max-width: 2rem;
}
</style>