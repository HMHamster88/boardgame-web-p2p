<template>
    <Dialog v-model:visible="showDialog" modal :header="t('developmentCard')" :closable="false">
        <div class="flex justify-center  m-1 mb-2">
            <img :src="developmentCardsImgs[developmentCard]" class="dev-card">
            </img>
        </div>
        <div class="flex justify-center m-1 mb-4">
            <CatanResourceTypeSelector v-model="selectedResourceType"
                v-if="developmentCard == CatanDevelopmentCardType.MONOPOLY"></CatanResourceTypeSelector>
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="t('use')" @click="close(true)" :disabled="!usableCard"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { CatanDevelopmentCardType, CatanResourceType, developmentCardIsUsable } from '../types/types';
import CatanResourceTypeSelector from './CatanResourceTypeSelector.vue';
import { developmentCardsImgs } from './graphics';

let localization: any = {
    en: {
        developmentCard: 'Development Card',
        use: 'Use'
    },
    ru: {
        developmentCard: 'Карта развития',
        use: 'Использовать'
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const selectedResourceType = ref<CatanResourceType | undefined>()

const usableCard = computed(() => {
    return developmentCardIsUsable[developmentCard.value]
})

const showDialog = ref(false)

var openPromise: Promise<boolean>

var openPromiseResolve: (result: boolean) => void

const developmentCard = ref<CatanDevelopmentCardType>(CatanDevelopmentCardType.KNIGNT)

async function open(devCard: CatanDevelopmentCardType): Promise<boolean> {
    developmentCard.value = devCard
    showDialog.value = true;
    openPromise = new Promise((resolve) => {
        openPromiseResolve = resolve
    });
    return openPromise
}

function close(save: boolean) {
    openPromiseResolve(save)
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