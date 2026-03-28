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
            <div class="flex overflow-auto">
                <div v-for="resource in resources" class="flex">
                    <img class="resource-icon" :src="resourcesImages[resource.type]"></img>
                    <span class="m-1">{{ resource.count }}</span>
                </div>
            </div>
        </div>
        <DevelopmentCardDialog ref="devCardDialog"></DevelopmentCardDialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, type PropType } from 'vue';
import { rangeArray, removeElement } from '../../../utils/arrayUtils';
import { developmentCardIsUsable, type CatanDevelopmentCardType, type CatanResourceCount, type CatanResourceType } from '../types/types';
import DevelopmentCardDialog from './DevelopmentCardDialog.vue';
import { developmentCardsImgs, resourceCardsImg, resourcesImages } from './graphics';

const model = defineModel<CatanResourceCount[]>()

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
    const counts: any = {}
    for (let index of selectedCardsInds.value) {
        const resurceType = flatResources.value[index]!
        if (counts[resurceType]) {
            counts[resurceType]++
        } else {
            counts[resurceType] = 1
        }
    }
    return Object.entries(counts).map(([name, matches]) => {
        return {
            type: name as CatanResourceType,
            count: matches as number
        } as CatanResourceCount
    })
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
        type: Object as PropType<CatanResourceCount[]>,
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
    return props.resources.flatMap(resource => rangeArray(resource.count).map(() => resource.type))
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