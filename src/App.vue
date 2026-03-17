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

const toast = useToast();

emitter.on('toastMessage', (message: ToastMessageOptions) => {
  toast.add(message)
})

</script>