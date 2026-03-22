<template>
    <div class="flex-auto">
        <div class="flex gap-2 items-center">
            <Button v-on:click="generateGameField">{{ t('generateField') }}</Button>
            <label for="type" class="font-semibold">{{ t('fieldType') }}</label>
            <Select id="type" v-model="settings.fieldType" :options="fieldTypes"
                :optionLabel="(type => t('fieldTypes.' + type))" />
        </div>
        <CatanHexGrid :field="settings.field"></CatanHexGrid>
    </div>
</template>

<script setup lang="ts">

import { type PropType } from 'vue';
import CatanHexGrid from './CatanHexGrid.vue';
import { type CatanGameSettings } from '../types/types';
import { type CatanGenerateFieldAction } from "../types/actions";
import { CatanGameFieldType } from "../types/catanGameFieldType";
import { useI18n } from 'vue-i18n';
import type { GameAction } from '../../../services/messages';

const fieldTypes = [
    CatanGameFieldType.CLASSIC,
    CatanGameFieldType.EXTENDED
]

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            fieldTypes: {
                CLASSIC: 'Classic',
                EXTENDED: 'Extended'
            },
            fieldType: 'Field Type:',
            generateField: 'Generate Field'
        },
        ru: {
            fieldTypes: {
                CLASSIC: 'Класика',
                EXTENDED: 'Расширенный'
            },
            fieldType: 'Тип Поля:',
            generateField: 'Сгенерировать поле'
        }
    }
})

function generateGameField() {
    const action: CatanGenerateFieldAction = {
        type: 'CatanGenerateFieldAction'
    }
    emit('performAction', action)
}

const props = defineProps({
    settings: {
        type: Object as PropType<CatanGameSettings>,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

</script>