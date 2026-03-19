<template>
    <Menubar>
        <template #start>
            <Button :label="t('games')" class="mr-2" as="router-link" variant="link" to="/" />
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
import { useI18n } from 'vue-i18n';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            games: 'Games'
        },
        ru: {
            games: 'Игры'
        }
    }
})

const popover = ref();

const route = useRoute();
const fullUrl = computed(() => {
    return window.location.origin + route.fullPath;
});

const toggle = (event: any) => {
    popover.value.toggle(event);
}

</script>