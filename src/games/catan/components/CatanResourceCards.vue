<template>
    <div>
        <div class="flex justify-center mt-2">
            <div class="resource-cards-container">
                <div v-for="resource in flatResources" class="resource-card"
                    style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <img :src="resourceCardsImg[resource.type]" class="resource-card-image">

                    </img>
                </div>
            </div>
        </div>
        <div class="flex justify-center gap-3">
            <div class="flex overflow-auto">
                <div v-for="resource in resources" class="flex">
                    <img class="resource-icon" :src="resourcesImages[resource.type]"></img>
                    <span class="m-1">{{ resource.count }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { CatanResourceCount } from '../types/types';
import { resourceCardsImg, resourcesImages } from './graphics';
import { rangeArray } from '../../../utils/arrayUtils';

const props = defineProps({
    resources: {
        type: Object as PropType<CatanResourceCount[]>,
        required: true
    }
})

const flatResources = computed(() => {
    return props.resources.flatMap(resource => rangeArray(resource.count).map(() => resource))
})

</script>

<style scoped>
.resource-cards-container {
    display: flex;
    overflow: auto;
    gap: 1rem;
    margin-top: 2rem;
    padding-bottom: 1rem;
}

.resource-card {
    border-radius: 8px;
}

.resource-card-image {
    border-radius: 8px;
    border: 1px solid #8f8f8f;
    width: 6rem;
    max-width: 6rem;
}

.resource-cards-container .resource-card:not(:first-child) {
    margin-left: -4rem;
}

.resource-icon {
    width: 2rem;
    max-width: 2rem;
}
</style>