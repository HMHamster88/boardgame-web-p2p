<template>
    <Dialog v-model:visible="showDialog" modal :header="t('playerTradeOffer', { player: playerName?.name })">
        <div class="flex flex-col">
            <div class="flex justify-center items-center gap-4 mb-8">
                <div class="flex flex-col gap-1" style="width: 50%;">
                    {{ t('playerOffer') }}
                    <div v-for="resource in playerTradeOffer?.offered" class="flex justify-center gap-2">
                        <img class="resource-icon" :src="resourcesImages[resource.type]">
                        </img>
                        <span class="m-1">{{ resource.count }}</span>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="pi pi-sort-alt rotate-90"></span>
                </div>
                <div class="flex flex-col gap-1" style="width: 50%;">
                    {{ t('playerWants') }}
                    <div v-for="resource in playerTradeOffer?.required" class="flex justify-center gap-2 "
                        :class="{ 'opacity-40': !hasResources(resource) }">
                        <img class="resource-icon" :src="resourcesImages[resource.type]">
                        </img>
                        <span class="m-1">{{ resource.count }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="$t('reject')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="$t('accept')" @click="close(true)" :disabled="!canAccept"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Player } from '../../../db/player'
import { getByType } from '../../../utils/arrayUtils'
import type { CatanPlayerTradeOffer, CatanResourceCount } from '../types/types'
import { resourcesImages } from './graphics'

let localization: any = {
    en: {
        playerTradeOffer: '{player} offered a deal',
        playerOffer: 'Player offer',
        playerWants: 'Player Wants'
    },
    ru: {
        playerTradeOffer: '{player} предлагает сделку',
        playerOffer: 'Игрок предлагает',
        playerWants: 'Игрок хочет'
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

function hasResources(reqResource: CatanResourceCount) {
    if (!props.availableResources || !props.playerTradeOffer) {
        return false
    }

    const availableResource = getByType(props.availableResources, reqResource.type)
    if (!reqResource || !availableResource) {
        return false
    }
    return availableResource.count >= reqResource.count
}

const canAccept = computed(() => {
    if (!props.availableResources || !props.playerTradeOffer) {
        return false
    }
    return props.playerTradeOffer?.required.every(req => {
        const aResource = getByType(props.availableResources, req.type)
        if (!aResource) {
            return
        }
        return req.count <= aResource.count
    })
})

const playerName = computed(() => {
    return props.players.find(pl => pl.userId == props.playerTradeOffer?.playerId)
})

const showDialog = computed(() => {
    if (!props.playerTradeOffer) {
        return false
    }
    if (props.playerTradeOffer.playerId == props.localPlayerId) {
        return false
    }
    if (props.playerTradeOffer.rejectedPlayerIds.includes(props.localPlayerId)) {
        return false
    }
    return true
})

function close(save: boolean) {
    emit('result', save)
}

const emit = defineEmits({
    result(_result: boolean) {
        return true
    }
})

const props = defineProps({
    availableResources: {
        type: Object as PropType<CatanResourceCount[]>,
        required: true
    },
    playerTradeOffer: {
        type: Object as PropType<CatanPlayerTradeOffer | undefined>,
        required: true
    },
    localPlayerId: {
        type: String,
        required: true
    },
    players: {
        type: Object as PropType<Player[]>,
        required: true
    }
})


</script>

<style scoped>
.resource-icon {
    width: 2rem;
    max-width: 2rem;
}
</style>