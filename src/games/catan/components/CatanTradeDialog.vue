<template>
    <Dialog v-model:visible="showDialog" modal :header="t('resourceExchange')">
        <div class="flex flex-col">
            <SelectButton v-model="deal.type" :options="tradeTypes" class="justify-center"
                :optionLabel="opt => t('tradeType.' + opt)" />
            <div class="flex justify-center items-center gap-4 mb-8">
                <div class="flex flex-col gap-1">
                    {{ t('myOffer') }}
                    <div v-for="resourceType in resourceTypes" class="flex items-center gap-2">
                        <CatanResourceCountSelector :resourceType="resourceType"
                            v-model="getByType(deal.offered, resourceType)!.count"
                            :step="step(deal.type, resourceType, resourcePrices)"
                            :max="getByType(availableResources, resourceType)?.count">
                        </CatanResourceCountSelector>
                        <span v-if="deal.type == CatanTradeType.BANK" class="text-nowrap">
                            {{ getByType(resourcePrices, resourceType)?.price }} : 1
                        </span>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="pi pi-sort-alt rotate-90"></span>
                </div>
                <div class="flex flex-col gap-1">
                    {{ t('iWant') }}
                    <div v-for="resourceType in resourceTypes">
                        <CatanResourceCountSelector :resourceType="resourceType"
                            v-model="getByType(deal.required, resourceType)!.count">
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
import { useI18n } from 'vue-i18n';
import _ from 'lodash';
import { ref, watch } from 'vue';
import { CatanResourceType, CatanTradeType, type CatanResourceCount, type CatanResourcePrice, type CatanTradeDeal } from '../types/types';
import CatanResourceCountSelector from './CatanResourceCountSelector.vue';
import { getByType } from '../../../utils/arrayUtils';
import { checkDeal } from '../types/utils';

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

const availableResources = ref<CatanResourceCount[]>([])

function deafutlDeal() {
    const deal: CatanTradeDeal = {
        type: CatanTradeType.BANK,
        offered: resourceTypes.value.map(type => {
            return {
                type: type,
                count: 0
            }
        }),
        required: resourceTypes.value.map(type => {
            return {
                type: type,
                count: 0
            }
        })
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

function step(dealType: CatanTradeType, resourceType: CatanResourceType, resourcePrices: CatanResourcePrice[]) {
    return dealType == CatanTradeType.BANK ? resourcePrices.find(p => p.type == resourceType)?.price : 1
}

watch(() => deal.value.type, () => {
    resetDeal()
})

const showDialog = ref(false)

const resourcePrices = ref(resourceTypes.value.map(type => {
    const price: CatanResourcePrice = {
        type: type,
        price: 4
    }
    return price
}))

var openPromise: Promise<CatanTradeDeal | undefined>

var openPromiseResolve: (deal: CatanTradeDeal | undefined) => void

async function open(availableResourcesParam: CatanResourceCount[], resourcePricesParam: CatanResourcePrice[]): Promise<CatanTradeDeal | undefined> {
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