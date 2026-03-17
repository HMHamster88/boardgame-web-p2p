import EventEmitter from 'eventemitter3';
import { type IceCandidateMessage, type AnswerMessage, type OfferMessage, type OnlineMesage, type SignalMessage, type SignalErrorMessage, SignalErrorType } from '../../server/src/messages'

export interface P2PConfig {
    channel: string
    signaWslUrl: string
    rtcConfig: RTCConfiguration
}

const stunServerUrl = import.meta.env.VITE_STUN_SERVER_URL || `stun:${location.hostname}:3478`
const signalServerUrl = import.meta.env.VITE_SIGNAL_WS_URL || `ws://${location.hostname}:8000/ws`

const rtcDefaultConfig = {
    iceServers: [
        { "urls": stunServerUrl }
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
    peerDisconnected: (peerId: string) => void
    dataMessage: (peerId: string, message: any) => void
    signalError: (errorType: SignalErrorType, message: string) => void
}

export class P2PConnection extends EventEmitter<P2PConnectionEvents> {
    readonly peerId: string
    readonly channelId: string
    readonly config: P2PConfig
    webSocket!: WebSocket
    readonly peers = new Map<string, PeerConnection>()

    constructor(peerId: string, channelId: string, config: P2PConfig) {
        super()
        this.peerId = peerId
        this.channelId = channelId
        this.config = config
    }

    async start() {
        this.webSocket = new WebSocket(this.config.signaWslUrl + `/${this.channelId}/${this.peerId}`)

        const promise = new Promise<void>((resolve, reject) => {
            this.webSocket.onopen = (_ev) => {
                resolve()
                this.emit('signalServerConnected')
            }
            this.webSocket.onclose = (_ev) => {
                reject()
            }

            this.webSocket.onerror = (ev) => {
                reject()
                console.log('Web scoket error', ev)
            }
        })

        this.webSocket.onmessage = async (ev) => {
            const message = JSON.parse(ev.data) as SignalMessage
            const handlers = {
                offer: async (message: OfferMessage) => {
                    const peerConnection = this.createPeerConnection(message.peerId)
                    this.peers.set(message.peerId, peerConnection)
                    const remoteOffer = new RTCSessionDescription(message.offer);
                    await peerConnection.setRemoteDescription(remoteOffer)

                    const remotePeerId = peerConnection.remotePeerId

                    peerConnection.connection.addEventListener('icecandidate', (e) => {
                        var cand = e.candidate;
                        if (!cand) {
                            const message: AnswerMessage = {
                                type: 'answer',
                                peerId: remotePeerId,
                                answer: peerConnection.connection.localDescription
                            }
                            this.sendSignalMessage(message)

                        }
                    })
                },
                answer: async (message: AnswerMessage) => {
                    const peerConnection = this.peers.get(message.peerId)
                    if (!peerConnection) {
                        console.log(`No peer with id "${message.peerId}"`)
                        return
                    }
                    const remoteOffer = new RTCSessionDescription(message.answer);
                    await peerConnection.setRemoteDescription(remoteOffer)
                },
                online: async (message: OnlineMesage) => {
                    if (!message.online) {
                        const peer = this.peers.get(message.peerId)
                        if (peer) {
                            this.emit('peerDisconnected', peer.remotePeerId)
                            this.peers.delete(peer.remotePeerId)
                        }
                    }
                },
                iceCandidate: async (message: IceCandidateMessage) => {
                    const peerConnection = this.peers.get(message.peerId)
                    if (!peerConnection) {
                        console.log(`No peer with id "${message.peerId}"`)
                        return
                    }
                    peerConnection.connection.addIceCandidate(message.candidate)
                },
                error: async (message: SignalErrorMessage) => {
                    console.log(`Signal error ${message.errorType} "${message.message}"`)
                    this.emit('signalError', message.errorType, message.message)
                }
            }

            const handler = (handlers as any)[message.type]

            if (handler) {
                await handler(message)
            }
        }
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

    isSignalServerConnected() {
        return this.webSocket.readyState == WebSocket.OPEN
    }

    sendSignalMessage<T extends SignalMessage>(message: T) {
        this.webSocket.send(JSON.stringify(message))
    }

    async connectTo(remotePeerId: string) {
        const newPeerConnection = this.createPeerConnection(remotePeerId)

        newPeerConnection.connection.addEventListener('icecandidate', (e) => {
            var cand = e.candidate;
            if (cand) {
                this.sendSignalMessage<IceCandidateMessage>({
                    type: 'iceCandidate',
                    peerId: remotePeerId,
                    candidate: cand
                })
            }

        })

        newPeerConnection.connection.onicecandidateerror = (e) => {
            console.log(`Candidate remote peer error "${remotePeerId}"`, e)
        }

        this.peers.set(remotePeerId, newPeerConnection)
        const offer = await newPeerConnection.createOffer()
        const message: OfferMessage = {
            type: 'offer',
            peerId: remotePeerId,
            offer: offer
        }
        this.sendSignalMessage(message)
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

    sendToAll(data: any) {
        this.peers.forEach((peer) => {
            if (peer.isConnected()) {
                peer.send(data)
            }
        })
    }

    close() {
        this.peers.forEach((peer) => {
            peer.close()
        })
        this.webSocket.close()
    }
}