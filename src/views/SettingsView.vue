<template>
    <Card>
        <template #content>
            <div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="language" class="font-semibold w-48">{{ t('language') }}</label>
                    <Select id="language" v-model="language" :options="languages" optionLabel="name"
                        class="flex-auto" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="name" class="font-semibold w-48">{{ t('defaultPlayerName') }}</label>
                    <InputText id="name" autocomplete="off" v-model="localStore.user.name" class="flex-auto" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="cp-hex" class="font-semibold w-48">{{ t('defaultPlayerColor') }}</label>
                    <ColorPicker inputId="cp-hex" format="hex" v-model="userColor" />
                </div>

                <div class="flex items-center gap-4 mb-4">
                    <label for="soundVolume" class="font-semibold w-48">{{ t('soundVolume') }}</label>
                    <Slider :min="0" :max="1" :step="0.01" inputId="soundVolume"
                        v-model="localStore.settings.soundsVolume" class="flex-auto" />
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLocalStore } from '../services/localStore'
import { useI18n } from 'vue-i18n'

const i18n = useI18n({
    locale: 'en',
    messages: {
        en: {

            defaultPlayerName: 'Default Player Name',
            defaultPlayerColor: 'Default Player Color',
            language: 'Language',
            soundVolume: 'Sound Volume'
        },
        ru: {

            defaultPlayerName: 'Имя игрока по умолчанию',
            defaultPlayerColor: 'Цвет игрока по умолчанию',
            language: 'Язык',
            soundVolume: 'Громкость звуков'
        }
    }
})

const t = i18n.t

interface Language {
    name: string
    locale: string
}

const languages = ref<Language[]>([
    {
        name: 'English',
        locale: 'en'
    },
    {
        name: 'Русский',
        locale: 'ru'
    }
])

const language = computed({
    get: () => {
        return languages.value.find(lang => lang.locale == i18n.locale.value)
    },
    set: (newVal: Language) => {
        i18n.locale.value = newVal.locale as any
        localStore.settings.locale = newVal.locale
    }
})

const localStore = useLocalStore();

const userColor = computed({
    get: () => {
        return localStore.user.color
    },
    set: (newValue) => {
        if (newValue.startsWith('#')) {
            localStore.user.color = newValue
        } else {
            localStore.user.color = '#' + newValue
        }
    }
})

</script>