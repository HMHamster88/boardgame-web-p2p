import { createApp } from 'vue'
import './style.css'
import 'primeicons/primeicons.css';
import App from './App.vue'
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import Aura from '@primeuix/themes/aura';
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Tooltip from 'primevue/tooltip';
import VueQrcode from '@chenfengyuan/vue-qrcode';

import router from './router/router'

const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
});

app.component('vue-qrcode', VueQrcode);
app.directive('tooltip', Tooltip)
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

app.mount('#app')
