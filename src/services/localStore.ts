import { defineStore } from 'pinia'


export interface User {
    id: string,
    name: string,
    color: string
}

interface LocalStore {
    user: User
}

export const useLocalStore = defineStore(
    'localStore',
    {
        state: (): LocalStore => ({
            user: {
                id: '',
                name: 'User',
                color: '#FF0000'
            }
        }),
        persist: true
    }
)
