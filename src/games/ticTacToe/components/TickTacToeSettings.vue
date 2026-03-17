<template>
    <div class="flex-auto">
        <label for="fieldSize" class="font-bold block mb-2">Field size</label>
        <InputNumber v-model="settings.fieldSize" inputId="fieldSize" fluid :min="3" :max="10" />
    </div>
</template>

<script setup lang="ts">

import { type PropType } from 'vue';
import type { TicTacToeGameSettings } from '../types'

const emit = defineEmits<{
    (e: 'changeSettings'): void
}>()


const porps = defineProps({
    settings: {
        type: Object as PropType<TicTacToeGameSettings>,
        required: true
    }
})

</script>