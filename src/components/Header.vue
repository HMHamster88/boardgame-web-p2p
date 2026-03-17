<template>
    <Menubar>
        <template #start>
            <Button label="Boardgames" class="mr-2" as="router-link" variant="link" to="/" />
        </template>


        <template #end>
            <div>

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

const popover = ref();

const route = useRoute();
const fullUrl = computed(() => {
    return window.location.origin + route.fullPath;
});

const toggle = (event: any) => {
    popover.value.toggle(event);
}

</script>