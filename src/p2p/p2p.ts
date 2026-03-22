import EventEmitter from 'eventemitter3';
import mqtt from 'mqtt';
import { channelId } from '../services/messages';
import { removeElement } from '../utils/arrayUtils';

export interface P2PConfig {
    channel: string
    signaWslUrl: string
    rtcConfig: RTCConfiguration
}

const stunServerUrl = import.meta.env.VITE_STUN_SERVER_URL || `stun:${location.hostname}:3478`
const signalServerUrl = import.meta.env.VITE_SIGNAL_WS_URL || `ws://${location.hostname}:8888`

const rtcDefaultConfig = {
    iceServers: [
        { "urls": [stunServerUrl] },
        { "urls": 'stun:stun1.l.google.com:19302' }
    ]
};

export const p2pDefaultConfig: P2PConfig = {
    channel: import.meta.env.VITE_P2P_CHANNEL_NAME || 'boardgame',
    signaWslUrl: signalServerUrl,
    rtcConfig: rtcDefaultConfig
}

interface PeerConnectionEvents {
    connected: () => void
    disconnected: () => void
    dataMessage: (message: any) => void
}

export type PeerFilter = (peerId: string) => boolean

export class PeerConnection extends EventEmitter<PeerConnectionEvents> {
    remotePeerId: string
    connection: RTCPeerConnection
    dataChannel: RTCDataChannel | undefined

    constructor(remotePeerId: string, rtcConfig: RTCConfiguration) {
        super()
        this.remotePeerId = remotePeerId
        this.connection = new RTCPeerConnection(rtcConfig);

        this.connection.ondatachannel = (e) => {
            if (e.channel.label == "dataChannel") {
                this.setDataChannel(e.channel)
            }
        }

        this.connection.oniceconnectionstatechange = (_e) => {
            //console.log(`ICE con change ${remotePeerId} ${this.connection.iceConnectionState}`)
        }
    }

    private setDataChannel(channel: RTCDataChannel) {
        this.dataChannel = channel
        this.dataChannel.onopen = (_e) => {
            this.emit('connected')
        }
        this.dataChannel.onmessage = (e) => {
            this.emit('dataMessage', e.data)
        }
        this.dataChannel.onclose = () => {
            this.emit('disconnected')
        }
        return this.dataChannel
    }

    isConnected() {
        return this.dataChannel?.readyState == "open"
    }

    send(data: any) {
        this.dataChannel?.send(data)
    }

    async createOffer() {
        this.setDataChannel(this.connection.createDataChannel('dataChannel'))
        const description = await this.connection.createOffer()
        await this.connection.setLocalDescription(description)
        return description
    }

    async setRemoteDescription(description: RTCSessionDescription) {
        await this.connection.setRemoteDescription(description)
        if (description.type == "offer") {
            const answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer)
            return answer
        }
        return null
    }

    close() {
        this.connection.close()
    }
}

interface P2PConnectionEvents {
    signalServerConnected: () => void
    peerConnected: (peerId: string) => void
    peerConnectedToChannel: (peerId: string) => void
    peerDisconnected: (peerId: string) => void
    dataMessage: (peerId: string, message: any) => void
    peerListReceived: (peerIds: string[]) => void
}

export class P2PConnection extends EventEmitter<P2PConnectionEvents> {
    readonly peerId: string
    readonly config: P2PConfig
    mqttClient!: mqtt.MqttClient
    readonly peers = new Map<string, PeerConnection>()
    channelPeerIds: string[] = []

    constructor(peerId: string, config: P2PConfig) {
        super()
        this.peerId = peerId
        this.config = config
    }

    async start() {
        const selfTopic = `${this.config.channel}/${this.peerId}`

        this.mqttClient = mqtt.connect(this.config.signaWslUrl, {
            will: {
                topic: selfTopic,
                payload: 'offline',
                qos: 1,
                retain: true
            }
        })

        const promise = new Promise<void>((resolve, reject) => {
            this.mqttClient.on('connect', () => {
                console.debug('MQTT conneted')

                this.mqttClient.publish(selfTopic, 'online', { qos: 1, retain: true, })
                this.mqttClient.subscribe(selfTopic + '/#')
                this.mqttClient.subscribe(`${this.config.channel}/+`)
                resolve()
            })

            this.mqttClient.on('error', (error) => {
                console.debug('Mqtt error', error.message)
                reject()
            })

            this.mqttClient.on('message', async (topic, message) => {
                const topicParts = topic.split('/')
                const peerId = topicParts[1]!
                const remotePeerId = topicParts[2]!
                const method = topicParts[3]!

                if (!remotePeerId) {
                    const stringMessage = message.toString()
                    if (stringMessage == 'online') {
                        if (!this.channelPeerIds.includes(peerId)) {
                            this.channelPeerIds.push(peerId)
                            this.emit('peerConnectedToChannel', peerId)
                        }
                    } else if (stringMessage == 'offline') {
                        removeElement(this.channelPeerIds, peerId)
                        this.emit('peerDisconnected', peerId)
                    }
                }

                const handlers = {
                    offer: async () => {
                        if (peerId == this.peerId) {
                            const peerConnection = this.createPeerConnection(remotePeerId)
                            this.peers.set(remotePeerId, peerConnection)
                            const offer = JSON.parse(message.toString())
                            const remoteOffer = new RTCSessionDescription(offer);
                            await peerConnection.setRemoteDescription(remoteOffer)

                            peerConnection.connection.addEventListener('icecandidate', (e) => {
                                var cand = e.candidate;
                                if (!cand) {
                                    this.mqttClient.publish(`${channelId}/${remotePeerId}/${this.peerId}/answer`,
                                        JSON.stringify(peerConnection.connection.localDescription))
                                }
                            })
                        }
                    },
                    answer: async () => {
                        const peerConnection = this.peers.get(remotePeerId)
                        if (!peerConnection) {
                            console.log(`No peer with id "${remotePeerId}"`)
                            return
                        }
                        const answer = JSON.parse(message.toString())
                        const remoteOffer = new RTCSessionDescription(answer);
                        await peerConnection.setRemoteDescription(remoteOffer)
                    },
                    iceCandidate: async () => {
                        const peerConnection = this.peers.get(remotePeerId)
                        if (!peerConnection) {
                            console.log(`No peer with id "${remotePeerId}"`)
                            return
                        }
                        const candidate = JSON.parse(message.toString())
                        peerConnection.connection.addIceCandidate(candidate)
                    }
                }

                const handler = (handlers as any)[method]
                if (handler) {
                    await handler()
                }

            })
        })
        return promise
    }

    private createPeerConnection(remotePeerId: string) {
        const connection = new PeerConnection(remotePeerId, this.config.rtcConfig)
        connection.on('connected', () => {
            this.emit('peerConnected', remotePeerId)
        })
        connection.on('disconnected', () => {
            this.emit('peerDisconnected', remotePeerId)
            this.peers.delete(remotePeerId)
        })
        connection.on('dataMessage', (message: any) => {
            this.emit('dataMessage', remotePeerId, message)
        })
        return connection;
    }

    async connectTo(remotePeerId: string) {
        if (this.peers.has(remotePeerId)) {
            console.log(`Already connected to peer "${remotePeerId}"`)
            return
        }
        const newPeerConnection = this.createPeerConnection(remotePeerId)

        newPeerConnection.connection.addEventListener('icecandidate', (e) => {
            var cand = e.candidate;
            if (cand) {
                this.mqttClient.publish(`${this.config.channel}/${remotePeerId}/${this.peerId}/iceCandidate`, JSON.stringify(cand))
            }

        })

        newPeerConnection.connection.onicecandidateerror = (e) => {
            console.log(`Candidate remote peer error "${remotePeerId}"`, e)
        }

        this.peers.set(remotePeerId, newPeerConnection)
        const offer = await newPeerConnection.createOffer()
        this.mqttClient.publish(`${this.config.channel}/${remotePeerId}/${this.peerId}/offer`, JSON.stringify(offer))
    }

    send(remotePeerId: string, data: any) {
        const peer = this.peers.get(remotePeerId);
        if (!peer) {
            throw Error(`No peer with id ${remotePeerId}`)
        }
        if (!peer.isConnected()) {
            throw Error(`Peer id ${remotePeerId} not connected yet`)
        }
        peer.send(data)
    }

    sendToAll(data: any, filter: PeerFilter | undefined = undefined) {
        this.peers.forEach((peer) => {
            if (peer.isConnected() && (!filter || filter(peer.remotePeerId))) {
                peer.send(data)
            }
        })
    }

    close() {
        this.peers.forEach((peer) => {
            peer.close()
        })
        const selfTopic = `${this.config.channel}/${this.peerId}`
        this.mqttClient.publish(selfTopic, 'offline')
        this.mqttClient.end()
    }
}