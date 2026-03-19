<template>
    <Dialog v-model:visible="showDialog" modal :header="confirm.title" :style="{ width: '25rem' }">
        <div class="flex items-center gap-4 mb-4">
            {{ confirm.message }}
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" :label="$t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="$t('ok')" @click="close(true)"></Button>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import emmiter, { type Confirm } from '../utils/eventBus'


const showDialog = ref(false)
const confirm = ref<Confirm>({
    title: 'title',
    message: 'message',
    closed: (_result: boolean) => { }
})

emmiter.on('confirm', (confirmMessage: Confirm) => {
    confirm.value = confirmMessage;
    showDialog.value = true
});

function close(accepted: boolean) {
    if (accepted) {
        confirm.value.closed(accepted)
    }
    showDialog.value = false
}
</script>