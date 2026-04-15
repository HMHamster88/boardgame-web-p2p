<template>
    <Dialog v-model:visible="showDialog" modal :header="t('developmentCard')" :closable="false">
        <div class="flex justify-center  m-1 mb-2">
            <img :src="developmentCardsImgs[developmentCard]" class="dev-card">
            </img>
        </div>
        <div class="flex justify-center m-1 mb-4">
            <div v-if="developmentCard == CatanDevelopmentCardType.MONOPOLY">
                <div class="flex justify-center">{{ t('chooseResourceType') }}</div>
                <CatanResourceTypeSelector v-model="selectedResourceType"></CatanResourceTypeSelector>
            </div>
            <div v-if="developmentCard == CatanDevelopmentCardType.YEAR_OF_PLENTY">
                <div class="flex justify-center">{{ t('chooseResourceType') }}</div>
                <CatanResourceTypeSelector v-model="selectedResourceType"></CatanResourceTypeSelector>
                <CatanResourceTypeSelector v-model="selectedSecondResourceType"></CatanResourceTypeSelector>
            </div>

        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="t('use')" @click="close(true)" :disabled="!canUseCard"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CatanUseDevelopmentCardAction, CatanUseResourceDevelopmentCardAction, CatanUseResourceTypeDevelopmentCardAction } from '../types/actions';
import { CatanDevelopmentCardType, CatanResourceType, developmentCardIsUsable } from '../types/types';
import { resourcesByTypes } from '../types/utils';
import CatanResourceTypeSelector from './CatanResourceTypeSelector.vue';
import { developmentCardsImgs } from './graphics';

let localization: any = {
    en: {
        chooseResourceType: 'Choose resource type',
        developmentCard: 'Development Card',
        use: 'Use'
    },
    ru: {
        chooseResourceType: 'Выберите тип ресурса',
        developmentCard: 'Карта развития',
        use: 'Использовать'
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const props = defineProps({
    isLocalPlayerTurn: {
        type: Boolean,
        required: true
    }
})

const selectedResourceType = ref<CatanResourceType | undefined>()
const selectedSecondResourceType = ref<CatanResourceType | undefined>()

const canUseCard = computed(() => {
    if (!(props.isLocalPlayerTurn && developmentCardIsUsable[developmentCard.value])) {
        return false
    }
    switch (developmentCard.value) {
        case CatanDevelopmentCardType.MONOPOLY:
            return selectedResourceType.value != undefined
        case CatanDevelopmentCardType.YEAR_OF_PLENTY:
            return selectedResourceType.value != undefined && selectedSecondResourceType.value != undefined
    }
    return true
})

const showDialog = ref(false)

var openPromise: Promise<CatanUseDevelopmentCardAction | undefined>

var openPromiseResolve: (result: CatanUseDevelopmentCardAction | undefined) => void

const developmentCard = ref<CatanDevelopmentCardType>(CatanDevelopmentCardType.KNIGNT)

async function open(devCard: CatanDevelopmentCardType): Promise<CatanUseDevelopmentCardAction | undefined> {
    developmentCard.value = devCard
    showDialog.value = true;
    openPromise = new Promise((resolve) => {
        openPromiseResolve = resolve
    });
    return openPromise
}

function createAction() {
    if (!developmentCardIsUsable[developmentCard.value]) {
        return undefined
    }
    switch (developmentCard.value) {
        case CatanDevelopmentCardType.MONOPOLY: {
            const action: CatanUseResourceTypeDevelopmentCardAction = {
                type: 'CatanUseDevelopmentCardAction',
                developmentCard: developmentCard.value,
                resourcesType: selectedResourceType.value!
            }
            return action
        }
        case CatanDevelopmentCardType.YEAR_OF_PLENTY: {
            const action: CatanUseResourceDevelopmentCardAction = {
                type: 'CatanUseDevelopmentCardAction',
                developmentCard: developmentCard.value,
                resources: resourcesByTypes(selectedResourceType.value!, selectedSecondResourceType.value!)
            }
            return action
        }
    }
    const action: CatanUseDevelopmentCardAction = {
        type: 'CatanUseDevelopmentCardAction',
        developmentCard: developmentCard.value
    }
    return action
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve(createAction())
    } else {
        openPromiseResolve(undefined)
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>

<style scoped>
.dev-card {
    border-radius: 10px;
    cursor: pointer;
    max-width: 10rem;
}
</style>