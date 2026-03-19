<template>
    <div class="flex-auto">
        <label for="pointsToWin" class="font-bold block mb-2">{{ $t('pointsToWin') }}</label>
        <InputNumber v-model="settings.pointsToWin" inputId="pointsToWin" fluid :min="2" :max="20" />
    </div>
</template>

<script setup lang="ts">

import { type PropType } from 'vue';
import type { CahGameSettings } from '../cahTypes';

const emit = defineEmits<{
    (e: 'changeSettings'): void
}>()

const porps = defineProps({
    settings: {
        type: Object as PropType<CahGameSettings>,
        required: true
    }
})

</script>