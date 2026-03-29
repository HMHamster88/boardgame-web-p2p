import EventEmitter from 'eventemitter3';
import _ from 'lodash';
import { typedPath, type TypedPathWrapper } from 'typed-path';
import type { PropChange } from '../utils/proxyObject';
import type { P2PConnection, PeerFilter } from './p2p';

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

type PropName<T extends object> = T extends string | symbol
    ? T
    : keyof T;

interface HasToString {
    toString(): string
}

type TypedPathFun<T> = (tp: TypedPathWrapper<T, Record<never, never>>) => HasToString | HasToString[]

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
                        const oldVal = _.get(this.value, part.path)
                        if (_.isObject(part.value) && !_.isArray(part.value) && oldVal) {
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

    sendUpdateTypedPath(peerFilter: string | PeerFilter | null, pathFun: TypedPathFun<T>) {
        if (!this.value) {
            return
        }

        const paths = pathFun(typedPath<T>())
        let parts: ObjectSyncPart[] = []

        if (Array.isArray(paths)) {
            parts = paths.map(prop => {
                const path = prop.toString()
                const propVal: any = _.get(this.value, path)
                const part: ObjectSyncPart = {
                    path: prop.toString(),
                    value: propVal
                }
                return part
            })
        } else {
            parts = [
                {
                    path: paths.toString(),
                    value: _.get(this.value, paths.toString())
                }
            ]
        }

        const updateMessage: ObjectSyncMessage = {
            type: 'ObjectSyncMessage',
            objectId: this.id,
            parts: parts
        }
        this.sendMessage(updateMessage, peerFilter)
    }

    sendUpdateTSBack(props: PropName<T>[] | PropName<T>, peerFilter: string | PeerFilter | null = null) {
        let parts: ObjectSyncPart[] = []

        if (!this.value) {
            return
        }

        if (Array.isArray(props)) {
            parts = props.map(prop => {
                const propVal: any = this.value![prop]
                const part: ObjectSyncPart = {
                    path: prop.toString(),
                    value: propVal
                }
                return part
            })
        } else {
            parts = [
                {
                    path: props.toString(),
                    value: this.value![props]
                }
            ]
        }
        const updateMessage: ObjectSyncMessage = {
            type: 'ObjectSyncMessage',
            objectId: this.id,
            parts: parts
        }
        this.sendMessage(updateMessage, peerFilter)
    }

    sendPropChanges(changes: PropChange[], peerFilter: string | PeerFilter | null = null) {
        const parts = changes.map(change => {
            const part: ObjectSyncPart = {
                path: change.path.join('.'),
                value: change.value
            }
            return part
        })
        const updateMessage: ObjectSyncMessage = {
            type: 'ObjectSyncMessage',
            objectId: this.id,
            parts: parts
        }
        this.sendMessage(updateMessage, peerFilter)
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