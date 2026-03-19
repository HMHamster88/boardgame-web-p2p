import { useLocalStore } from '../services/localStore'
import notificationSound from '../assets/sounds/notification.mp3'



export const soundService = {
    playSound(src: string) {
        const localStore = useLocalStore();
        if (localStore.settings.soundsVolume != 0) {
            const audio = new Audio(src)
            audio.volume = localStore.settings.soundsVolume
            audio.play()
        }
    },

    notification() {
        this.playSound(notificationSound)
    }
}