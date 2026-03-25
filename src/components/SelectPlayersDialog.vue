<template>
    <Dialog v-model:visible="showDialog" modal :header="multiple ? t('selctPlayers') : t('selectPlayer')"
        :style="{ width: '25rem' }">
        <div class="flex items-center gap-4 mb-8">
            <Listbox :multiple="multiple" v-model="selectedPlayes" :options="players" optionLabel="name" checkmark
                :highlightOnSelect="false" class="w-full md:w-56" />
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="$t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="$t('ok')" @click="close(true)"
                :disabled="selectedPlayes.length == 0"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import _ from 'lodash';
import type { Player } from '../db/player';
import { ref } from 'vue';

let localization: any = {
    en: {
        selctPlayers: 'Select Players',
        selectPlayer: 'Select Player'
    },
    ru: {
        selctPlayers: 'Выберите игроков',
        selectPlayer: 'Выберите игрока'
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const showDialog = ref(false)

const players = ref<Player[]>([])
const selectedPlayes = ref<Player[]>([])
const multiple = ref(false)

var openPromise: Promise<Player[]>

var openPromiseResolve: (value: Player[]) => void

async function open(list: Player[], multi: boolean): Promise<Player[]> {
    players.value = list
    multiple.value = multi
    selectedPlayes.value = []
    showDialog.value = true;
    openPromise = new Promise((resolve) => {
        openPromiseResolve = resolve
    });
    return openPromise
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve(selectedPlayes.value)
    } else {
        openPromiseResolve([])
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>