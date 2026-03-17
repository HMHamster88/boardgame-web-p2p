<template>
    <Menubar>
        <template #start>
            <Button label="Boardgames" class="mr-2" as="router-link" variant="link" to="/" />
        </template>


        <template #end>
            <div>
                <Badge class="mr-2" :severity="connectStatusSeverity">{{ connectStatusText }}</Badge>
                <Button type="button" icon="pi pi-share-alt" @click="toggle" />
                <Popover ref="popover">
                    <div>
                        <vue-qrcode :value="fullUrl" :options="{ width: 200 }"></vue-qrcode>
                    </div>
                </Popover>
                <Button type="button" icon="pi pi-cog" as="router-link" variant="link" to="/settings" />

            </div>
        </template>
    </Menubar>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref } from "vue";
import emmiter from '../utils/eventBus'
import { ConnectStatus } from '../services/gameClient';

const popover = ref();

const connectStatusText = ref('Connecting...')
const connectStatusSeverity = ref('warn')

const route = useRoute();
const fullUrl = computed(() => {
    return window.location.origin + route.fullPath;
});

const toggle = (event: any) => {
    popover.value.toggle(event);
}

emmiter.on('connectStatusChanged', (status) => {
    switch (status) {
        case ConnectStatus.CONNECTED:
            connectStatusText.value = "Connected"
            connectStatusSeverity.value = 'success'
            break
        case ConnectStatus.CONNECTING:
            connectStatusText.value = "Connecting..."
            connectStatusSeverity.value = 'warn'
            break
        case ConnectStatus.DISCONNECTED:
            connectStatusText.value = "Disconnected"
            connectStatusSeverity.value = 'danger'
            break
    }
})

</script>