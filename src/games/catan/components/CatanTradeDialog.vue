<template>
    <Dialog v-model:visible="showDialog" modal :header="t('resourceExchange')">
        <div class="flex flex-col">
            <SelectButton v-model="deal.type" :options="tradeTypes" class="justify-center"
                :optionLabel="opt => t('tradeType.' + opt)" />
            <div class="flex justify-center items-center gap-4 mb-8">
                <div class="flex flex-col gap-1">
                    {{ t('myOffer') }}
                    <div v-for="resourceType in resourceTypes" class="flex items-center gap-2">
                        <CatanResourceCountSelector :resourceType="resourceType" v-model="deal.offered[resourceType]"
                            :step="step(deal.type, resourceType, resourcePrices)"
                            :max="availableResources[resourceType]" :available="availableResources[resourceType]">
                        </CatanResourceCountSelector>
                        <span v-if="deal.type == CatanTradeType.BANK" class="text-nowrap">
                            {{ resourcePrices[resourceType] }} : 1
                        </span>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="pi pi-sort-alt rotate-90"></span>
                </div>
                <div class="flex flex-col gap-1">
                    {{ t('iWant') }}
                    <div v-for="resourceType in resourceTypes">
                        <CatanResourceCountSelector :resourceType="resourceType" v-model="deal.required[resourceType]">
                        </CatanResourceCountSelector>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="$t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="$t('ok')" @click="close(true)"
                :disabled="!checkDeal(deal, resourcePrices, availableResources)"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { CatanResourceType, CatanTradeType, initResourcePrices, initResources, type CatanResourcePrices, type CatanResources, type CatanTradeDeal } from '../types/types';
import { checkDeal } from '../types/utils';
import CatanResourceCountSelector from './CatanResourceCountSelector.vue';

let localization: any = {
    en: {
        myOffer: 'My Offer',
        iWant: 'I Want',
        tradeType: {
            BANK: 'With Bank',
            PLAYER: 'With Players'
        }
    },
    ru: {
        myOffer: 'Моё предложение',
        iWant: 'Я хочу',
        tradeType: {
            BANK: 'С Банком',
            PLAYER: 'С Игроками'
        }
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})


const resourceTypes = ref(Object.keys(CatanResourceType).map(v => v as CatanResourceType))

const availableResources = ref<CatanResources>(initResources({}))

function deafutlDeal() {
    const deal: CatanTradeDeal = {
        type: CatanTradeType.BANK,
        offered: initResources({}),
        required: initResources({})
    }
    return deal
}

const deal = ref<CatanTradeDeal>(deafutlDeal())

const tradeTypes = ref(Object.values(CatanTradeType).map(v => v as CatanTradeType))

function resetDeal() {
    const defaultDeal = deafutlDeal()
    defaultDeal.type = deal.value.type
    Object.assign(deal.value, defaultDeal)
}

function step(dealType: CatanTradeType, resourceType: CatanResourceType, resourcePrices: CatanResourcePrices) {
    return dealType == CatanTradeType.BANK ? resourcePrices[resourceType] : 1
}

watch(() => deal.value.type, () => {
    resetDeal()
})

const showDialog = ref(false)

const resourcePrices = ref(initResourcePrices({}, 4))

var openPromise: Promise<CatanTradeDeal | undefined>

var openPromiseResolve: (deal: CatanTradeDeal | undefined) => void

async function open(availableResourcesParam: CatanResources, resourcePricesParam: CatanResourcePrices): Promise<CatanTradeDeal | undefined> {
    resetDeal()
    availableResources.value = availableResourcesParam
    resourcePrices.value = resourcePricesParam
    showDialog.value = true;
    openPromise = new Promise((resolve) => {
        openPromiseResolve = resolve
    });
    return openPromise
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve(deal.value)
    } else {
        openPromiseResolve(undefined)
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>