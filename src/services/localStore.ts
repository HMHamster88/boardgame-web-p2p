import { defineStore } from 'pinia'


export interface User {
    id: string,
    name: string,
    color: string
}

export interface Settings {
    locale: string
}

interface LocalStore {
    user: User,
    settings: Settings
}

export const useLocalStore = defineStore(
    'localStore',
    {
        state: (): LocalStore => ({
            user: {
                id: '',
                name: 'User',
                color: '#FF0000'
            },
            settings: {
                locale: 'en'
            }
        }),
        persist: true
    }
)
