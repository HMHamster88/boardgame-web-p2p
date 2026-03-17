import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

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
                id: uuidv4(),
                name: 'User',
                color: '#FF0000'
            }
        }),
        persist: true
    }
)
