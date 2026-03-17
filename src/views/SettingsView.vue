<template>
    <Card>
        <template #content>
            <div :style="{ width: '25rem' }">
                PlayerID: {{ localStore.user.id }}
                <div class="flex items-center gap-4 mb-4">
                    <label for="name" class="font-semibold w-48">Default Player Name</label>
                    <InputText id="name" class="flex-auto" autocomplete="off" v-model="localStore.user.name" />
                </div>
                <div class="flex items-center gap-4 mb-4">
                    <label for="cp-hex" class="font-semibold w-48">Default Player Color</label>
                    <ColorPicker inputId="cp-hex" format="hex" v-model="localStore.user.color" />
                </div>
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
import { useLocalStore } from '../services/localStore'

const localStore = useLocalStore();

</script>