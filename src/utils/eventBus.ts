import mitt, { type Emitter } from 'mitt';
import type { ToastMessageOptions } from 'primevue/toast'
import type { ConnectStatus } from '../services/gameClient';


export interface Confirm {
    title: string,
    message: string,
    closed: (result: boolean) => void
}

type AppEvents = {
    confirm: Confirm
    toastMessage: ToastMessageOptions,
    connectStatusChanged: ConnectStatus
}

const emitter: Emitter<AppEvents> = mitt<AppEvents>();

export default emitter;

/*export default {
    confirm(confirm: Confirm) {
        emitter.emit('confirm', confirm)
    },
    onConfirm(handler: (message: Confirm) => void) {
        emitter.on('confirm', (message: any) => {
            handler(message)
        })
    },
    showToastMessage(options: ToastMessageOptions) {
        emitter.emit('toast', options)
    },

    onToastMessge(handler: (message: ToastMessageOptions) => void) {
        emitter.on('toast', (message: any) => {
            handler(message)
        })
    },
    connectStatus(status: ConnectStatus) {
        emitter.on('connectStatus', status)
    }
};*/