import _ from 'lodash';
import type { P2PConnection } from './p2p';

interface ObjectSyncMessage {
    type: 'ObjectSyncMessage'
    objectId: string,
    value: any,
    path: string | null
}

interface ObjectSyncConfig<T> {
    connection: P2PConnection
    id: string
    retranslateChanges?: boolean
    value?: T
    valueSetter?: ((va: T) => T),
    peerFiler?: (peerId: string) => boolean
}

export class ObjectSync<T extends object> {
    id: string
    value?: T
    valueSetter?: ((va: T) => T)
    retranslateChanges?: boolean
    connection: P2PConnection
    peerFiler?: (peerId: string) => boolean

    constructor(config: ObjectSyncConfig<T>) {
        this.id = config.id
        this.value = config.value
        this.valueSetter = config.valueSetter
        this.connection = config.connection
        this.retranslateChanges = config.retranslateChanges
        this.peerFiler = config.peerFiler

        this.connection.addListener('dataMessage', (_peerId, stringMessage) => {
            const message = JSON.parse(stringMessage) as ObjectSyncMessage
            if (message && message.type == "ObjectSyncMessage" && message.objectId == this.id) {
                if (!message.path && this.valueSetter) {
                    this.value = this.valueSetter(message.value)
                } else if (this.value && message.path) {
                    if (_.isObject(message.value) && !_.isArray(message.value)) {
                        const oldVal = _.get(this.value, message.path)
                        Object.assign(oldVal, message.value)
                    } else {
                        _.set(this.value, message.path, message.value)
                    }
                }
                if (this.retranslateChanges) {
                    this.sendUpdate(message.path)
                }
            }
        })
    }

    sendUpdate(path: string | null = null, peerId: string | null = null) {
        console.log('Send update', this.connection.peerId, this.value)
        const updateValue = path ? _.get(this.value, path) : this.value
        const updateMessage: ObjectSyncMessage = {
            type: 'ObjectSyncMessage',
            objectId: this.id,
            value: updateValue,
            path: path
        }
        const stringMessage = JSON.stringify(updateMessage)
        if (peerId) {
            if (!this.peerFiler || this.peerFiler(peerId)) {
                this.connection.send(peerId, stringMessage)
            }
        } else {
            this.connection.sendToAll(stringMessage, this.peerFiler)
        }
    }
}