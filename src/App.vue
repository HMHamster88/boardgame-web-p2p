<template>
  <Header></Header>
  <Toast />
  <main class="mt-2">
    <RouterView />
    <ConfirmDialog></ConfirmDialog>
  </main>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import Header from './components/Header.vue';
import emitter from './utils/eventBus'
import { type ToastMessageOptions } from 'primevue/toast';
import { useLocalStore } from './services/localStore'
import { v4 as uuidv4 } from 'uuid'
const toast = useToast();

const localStore = useLocalStore();
if (!localStore.user.id) {
  localStore.user.id = uuidv4()
}

emitter.on('toastMessage', (message: ToastMessageOptions) => {
  toast.add(message)
})

</script>