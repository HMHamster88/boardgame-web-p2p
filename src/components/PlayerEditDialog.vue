<template>
    <Dialog v-model:visible="showDialog" modal :header="t('editPlayer')" :style="{ width: '25rem' }">
        <div class="flex items-center gap-4 mb-4">
            <label for="name" class="font-semibold w-24">{{ t('playerName') }}</label>
            <InputText id="name" class="flex-auto" autocomplete="off" v-model="dialogPlayer.name" />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="cp-hex" class="font-semibold w-24">{{ t('playerColor') }}</label>
            <ColorPicker v-model="dialogPlayer.color" inputId="cp-hex" format="hex" class="mb-4" />
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="t('save')" @click="close(true)"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            editPlayer: 'Edit player',
            playerName: 'Name',
            playerColor: 'Color'

        },
        ru: {
            editPlayer: 'Edit player',
            playerName: 'Name',
            playerColor: 'Color'
        }
    }
})

const showDialog = ref(false)
const dialogPlayer = ref<PlayerProps>({
    name: 'Player name',
    color: 'ff0000'
})

interface PlayerProps {
    name: string,
    color: string
}

var openPromise: Promise<PlayerProps>
var openPromiseResolve: (value: PlayerProps | PromiseLike<PlayerProps>) => void
var openPromiseReject: (reason?: any) => void

async function open(player: PlayerProps): Promise<PlayerProps> {
    showDialog.value = true;
    Object.assign(dialogPlayer.value, player)
    openPromise = new Promise((resolve, reject) => {
        openPromiseResolve = resolve
        openPromiseReject = reject
    });
    return openPromise
}

function close(save: boolean) {
    if (save) {
        if (!dialogPlayer.value.color.startsWith("#")) {
            dialogPlayer.value.color = '#' + dialogPlayer.value.color;
        }
        openPromiseResolve(dialogPlayer.value)
    } else {
        openPromiseReject()
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>