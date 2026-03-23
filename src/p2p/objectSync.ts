import _ from 'lodash';
import type { P2PConnection, PeerFilter } from './p2p';
import EventEmitter from 'eventemitter3';

interface ObjectSyncPart {
    path: string | undefined,
    value: any
}

interface ObjectSyncMessage {
    type: 'ObjectSyncMessage'
    objectId: string,
    parts: ObjectSyncPart[]
}

interface ObjectSyncConfig<T> {
    connection: P2PConnection
    id: string
    retranslateChanges?: boolean
    value?: T
    valueSetter?: ((va: T) => T),
    peerFiler?: (peerId: string) => boolean
}

interface ObjectSyncEvents {
    syncronized: (message: ObjectSyncMessage) => void
}

export class ObjectSync<T extends object> extends EventEmitter<ObjectSyncEvents> {
    id: string
    value?: T
    valueSetter?: ((va: T) => T)
    retranslateChanges?: boolean
    connection: P2PConnection
    peerFiler?: (peerId: string) => boolean
    updateSended: boolean = false
    updateReceived: boolean = true // flag to prevent cycle updates from watch handler

    constructor(config: ObjectSyncConfig<T>) {
        super()
        this.id = config.id
        this.value = config.value
        this.valueSetter = config.valueSetter
        this.connection = config.connection
        this.retranslateChanges = config.retranslateChanges
        this.peerFiler = config.peerFiler

        this.connection.addListener('dataMessage', (_peerId, stringMessage) => {
            const message = JSON.parse(stringMessage) as ObjectSyncMessage
            if (message && message.type == "ObjectSyncMessage" && message.objectId == this.id) {
                this.updateReceived = true
                for (let part of message.parts) {
                    if (!part.path && this.valueSetter) {
                        this.value = this.valueSetter(part.value)
                    } else if (this.value && part.path) {
                        if (_.isObject(part.value) && !_.isArray(part.value)) {
                            const oldVal = _.get(this.value, part.path)
                            Object.assign(oldVal, part.value)
                        } else {
                            _.set(this.value, part.path, part.value)
                        }
                    }

                }
                this.emit('syncronized', message)
                if (this.retranslateChanges) {
                    this.sendMessage(message, (peerId) => {
                        return peerId != _peerId
                    })
                }
            }
        })
    }

    sendUpdate(paths: string[] | string | null = null, peerFilter: string | PeerFilter | null = null) {
        let parts: ObjectSyncPart[] = []

        if (!paths) {
            parts = [
                {
                    path: undefined,
                    value: this.value
                }
            ]
        } else if (typeof paths === 'string') {
            parts = [
                {
                    path: paths,
                    value: _.get(this.value, paths)
                }
            ]
        } else {
            parts = paths.map(path => {
                const part: ObjectSyncPart = {
                    path: path,
                    value: _.get(this.value, path)
                }
                return part
            })
        }

        const updateMessage: ObjectSyncMessage = {
            type: 'ObjectSyncMessage',
            objectId: this.id,
            parts: parts
        }
        this.sendMessage(updateMessage, peerFilter)
    }

    sendMessage(updateMessage: ObjectSyncMessage, peerId: string | PeerFilter | null = null) {
        const stringMessage = JSON.stringify(updateMessage)
        if (typeof peerId === 'string') {
            if (!this.peerFiler || this.peerFiler(peerId)) {
                this.connection.send(peerId, stringMessage)
                this.updateSended = true
            }
        } else if (!peerId) {
            this.connection.sendToAll(stringMessage, this.peerFiler)
            this.updateSended = true
        } else {
            this.connection.sendToAll(stringMessage, peer => {
                return peerId(peer) && (!this.peerFiler || this.peerFiler(peer))
            })
            this.updateSended = true
        }
    }
}