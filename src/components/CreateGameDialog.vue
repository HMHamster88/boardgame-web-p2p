<template>
    <Dialog v-model:visible="showDialog" modal :header="t('createGame')" :style="{ width: '25rem' }">
        <div class="flex items-center gap-4 mb-4">
            <label for="name" class="font-semibold w-24">{{ t('gameName') }}</label>
            <InputText id="name" class="flex-auto" autocomplete="off" v-model="name" />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="type" class="font-semibold w-24">{{ t('gameType') }}</label>
            <Select id="type" v-model="type" :options="gameTypes" optionLabel="name" placeholder="Select a Type"
                class="flex-auto" />
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="$t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="$t('ok')" @click="close(true)"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type CrateGameProps } from '../db/game';
import { useLocalStore } from '../services/localStore'
import { typedGameNames, type TypedName } from '../services/gameService/gameServiceSelector';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            createGame: 'Create Game',
            gameName: 'Name',
            gameType: 'Type',
            newGame: 'New Game'

        },
        ru: {
            createGame: 'Создать игру',
            gameName: 'Название',
            gameType: 'Тип',
            newGame: 'Новая игра'
        }
    }
})

const localStore = useLocalStore();

const showDialog = ref(false)

const name = ref(t('newGame'))
const gameTypes = ref<TypedName[]>(typedGameNames)

const type = ref<TypedName>(gameTypes.value[0]!)

var openPromise: Promise<CrateGameProps>

var openPromiseResolve: (value: CrateGameProps | PromiseLike<CrateGameProps>) => void
var openPromiseReject: (reason?: any) => void

async function open(): Promise<CrateGameProps> {
    showDialog.value = true;
    openPromise = new Promise((resolve, reject) => {
        openPromiseResolve = resolve
        openPromiseReject = reject
    });
    return openPromise
}

function close(save: boolean) {
    if (save) {
        openPromiseResolve({
            name: name.value,
            type: type.value.type,
            owner: localStore.user.id
        })
    } else {
        openPromiseReject()
    }
    showDialog.value = false
}

defineExpose({
    open
})

</script>