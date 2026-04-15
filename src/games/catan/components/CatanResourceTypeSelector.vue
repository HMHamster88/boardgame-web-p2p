<template>
    <div class="flex">
        <div v-for="resource in resourceTypes" class="flex justify-center gap-2 mr-1 resource-button"
            :class="{ highlight: resource == model }">
            <img class="resource-icon" :src="resourcesImages[resource]" v-on:click="selectRsource(resource)">
            </img>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CatanResourceType } from '../types/types'
import { resourcesImages } from './graphics'

const resourceTypes = ref(Object.keys(CatanResourceType).map(v => v as CatanResourceType))

const model = defineModel<CatanResourceType | undefined>()

function selectRsource(type: CatanResourceType) {
    if (type == model.value) {
        model.value = undefined
    } else {
        model.value = type
    }
}

</script>

<style scoped>
.resource-button {
    border-radius: 8px;
    cursor: pointer;
}

.resource-icon {
    width: 2rem;
    max-width: 2rem;
    margin: 0.5rem;
}

.highlight {
    box-shadow: inset 0px 0px 5px rgb(0, 250, 17);
}
</style>