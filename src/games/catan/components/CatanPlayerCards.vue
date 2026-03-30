<template>
    <div>
        <div class="flex justify-center mt-2">
            <div class="resource-cards-container">
                <div class="flex justify-center">
                    <div v-for="resource, index in flatResources" class="resource-card"
                        :class="{ 'resource-card-selected': selectedCardsInds.includes(index) }"
                        v-on:click="cardClick(index)"
                        style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <img :src="resourceCardsImg[resource]" class="resource-card-image">

                        </img>
                    </div>
                </div>
                <div class="flex justify-center">
                    <div v-for="devCard in developmentCards" class="resource-card" v-on:click="clickDevCard(devCard)"
                        style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <img :src="developmentCardsImgs[devCard]" class="resource-card-image">

                        </img>
                    </div>
                </div>
            </div>

        </div>
        <div class="flex justify-center gap-3">
            <div class="flex overflow-auto gap-2">
                <div v-for="[resourceType, resourceCount] in recordEntries(resources)" class="flex">
                    <img class="resource-icon" :src="resourcesImages[resourceType]"></img>
                    <span class="m-1">{{ resourceCount }}</span>
                </div>
            </div>
        </div>
        <DevelopmentCardDialog ref="devCardDialog"></DevelopmentCardDialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, type PropType } from 'vue';
import { rangeArray, recordEntries, removeElement } from '../../../utils/arrayUtils';
import { developmentCardIsUsable, initResources, type CatanDevelopmentCardType, type CatanResources } from '../types/types';
import DevelopmentCardDialog from './DevelopmentCardDialog.vue';
import { developmentCardsImgs, resourceCardsImg, resourcesImages } from './graphics';

const model = defineModel<CatanResources>()

const selectedCardsInds = ref<number[]>([])
function cardClick(index: number) {

    if (selectedCardsInds.value.includes(index)) {
        removeElement(selectedCardsInds.value, index)
    } else {
        selectedCardsInds.value.push(index)
    }

    model.value = getSelectedResources()
}

function getSelectedResources() {
    const resources = initResources({})
    for (let index of selectedCardsInds.value) {
        const resurceType = flatResources.value[index]!
        resources[resurceType]++
    }
    return resources
}

const devCardDialog = useTemplateRef('devCardDialog')

async function clickDevCard(devCard: CatanDevelopmentCardType) {
    if (await devCardDialog.value?.open(devCard) && developmentCardIsUsable[devCard]) {
        emit('useDevCard', devCard)
    }
}

const emit = defineEmits<{
    (e: 'useDevCard', card: CatanDevelopmentCardType): void
}>()


const props = defineProps({
    resources: {
        type: Object as PropType<CatanResources>,
        required: true
    },
    developmentCards: {
        type: Object as PropType<CatanDevelopmentCardType[]>,
        required: true
    },
    openedDevelopmentCards: {
        type: Object as PropType<CatanDevelopmentCardType[]>,
        required: true
    }
})

const flatResources = computed(() => {
    return recordEntries(props.resources).flatMap(([resourceType, resourceCount]) => rangeArray(resourceCount).map(() => resourceType))
})

</script>

<style scoped>
.resource-cards-container {
    display: flex;
    overflow: auto;
    gap: 1rem;
    padding-top: 2rem;
    padding-bottom: 1rem;
}

.resource-card {
    border-radius: 8px;
    cursor: pointer;
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

.resource-card-selected {
    margin-top: -2rem;
}
</style>