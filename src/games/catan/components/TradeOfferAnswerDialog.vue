<template>
    <Dialog v-model:visible="showDialog" modal :header="t('waitingForPlayerAnswers')">
        <div class="flex flex-col">
            <div class="flex justify-center items-center gap-4 mb-8 flex-col">
                <div v-for="player in notAnsweredPlayers">
                    <div>{{ player.name }}</div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { CatanPlayerTradeOffer } from '../types/types'
import { useI18n } from 'vue-i18n'
import type { Player } from '../../../db/player'

let localization: any = {
    en: {
        waitingForPlayerAnswers: 'Waiting For Players Answers',
    },
    ru: {
        waitingForPlayerAnswers: 'Ожидание ответа игроков',
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const notAnsweredPlayers = computed(() => {
    return props.players.filter(pl => !props.playerTradeOffer?.rejectedPlayerIds.includes(pl.userId) && pl.userId != props.localPlayerId)
})


const showDialog = computed(() => {
    if (!props.playerTradeOffer) {
        return false
    }
    if (props.playerTradeOffer.playerId != props.localPlayerId) {
        return false
    }
    return true
})

const props = defineProps({
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