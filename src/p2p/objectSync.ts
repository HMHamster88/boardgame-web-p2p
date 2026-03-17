import _ from 'lodash';
import type { P2PConnection } from './p2p';

interface ObjectSyncMessage {
    type: 'ObjectSyncMessage'
    objectId: string,
    value: any,
    path: string | null
}

export class ObjectSync<T extends object> {
    id: string
    value: T | null
    valueSetter: ((va: T) => T) | null
    retranslateChanges: boolean
    connection: P2PConnection

    constructor(connection: P2PConnection, id: string, retranslateChanges: boolean, value: T | null, valueSetter: ((va: T) => T) | null = null) {
        this.id = id
        this.value = value
        this.valueSetter = valueSetter
        this.connection = connection
        this.retranslateChanges = retranslateChanges

        connection.addListener('dataMessage', (_peerId, stringMessage) => {
            const message = JSON.parse(stringMessage) as ObjectSyncMessage
            if (message && message.type == "ObjectSyncMessage" && message.objectId == id) {
                if (!message.path && this.valueSetter) {
                    this.value = this.valueSetter(message.value)
                } else if (this.value && message.path) {
                    if (_.isObject(message.value)) {
                        const oldVal = _.get(this.value, message.path)
                        Object.assign(oldVal, message.value)
                    } else {
                        _.set(this.value, message.path, message.value)
                    }
                }
                if (retranslateChanges) {
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
            this.connection.send(peerId, stringMessage)
        } else {
            this.connection.sendToAll(stringMessage)
        }
    }
}