import express from 'express';
import { configDotenv } from 'dotenv';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import history from 'connect-history-api-fallback';
import Turn from 'node-turn';
import {
    AnswerMessage,
    IceCandidateMessage,
    OfferMessage,
    OnlineMesage,
    PeersListMessage,
    SignalErrorMessage,
    SignalErrorType,
    SignalMessage
} from './messages';

interface ExpressWsApplication extends express.Application {
    ws(path: string, callback: (ws: WebSocket, req: express.Request) => void): this;
}

configDotenv();

const { app } = expressWs(express()) as {
    app: ExpressWsApplication;
};
const port = process.env.PORT ?? 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const staticMw = express.static('./public');

app.use(staticMw);

app.use(
    history({
        verbose: true,
        index: '/index.html'
    })
);

app.use(staticMw);

class Peer {
    id: string;
    socket: WebSocket;
    constructor(id: string, socket: WebSocket) {
        this.id = id;
        this.socket = socket;
    }

    send(data: any) {
        this.socket.send(JSON.stringify(data));
    }
}

class Channel {
    id: string;
    peers = new Map<string, Peer>();
    constructor(id: string) {
        this.id = id;
    }
}

const channels = new Map<string, Channel>();

app.ws('/ws/:channelId/:peerId', (ws, req) => {
    const channelId = req.params.channelId as string;
    const peerId = req.params.peerId as string;
    console.log(`Peer "${peerId}" connected to ws channel "${channelId}"`);

    let channel = channels.get(channelId);
    if (!channel) {
        channel = new Channel(channelId);
        channels.set(channelId, channel);
    }

    function sendError(errorType: SignalErrorType, message: string) {
        console.log(message);
        const data: SignalErrorMessage = {
            type: 'error',
            errorType: errorType,
            message: message
        };
        ws.send(JSON.stringify(data));
    }

    if (channel.peers.has(peerId)) {
        const errorMessage = `Peer "${peerId}" already connected to channel "${channelId}"`;
        console.log(errorMessage);
        sendError(SignalErrorType.PEER_ALREADY_CONNECTED, errorMessage);
        ws.close(500, errorMessage);
    }

    channel.peers.forEach((peer) => {
        peer.send({
            type: 'online',
            peerId: peerId,
            online: true
        } as OnlineMesage);
    });

    const peer = new Peer(peerId, ws);

    channel.peers.set(peerId, peer);

    peer.send({
        type: 'peersList',
        peers: Array.from(channel.peers.keys())
    } as PeersListMessage);

    ws.on('message', (stringData: string) => {
        const data = JSON.parse(stringData) as SignalMessage;

        const handlers = {
            offer: (message: OfferMessage) => {
                const peer = channel.peers.get(message.peerId);
                if (!peer) {
                    sendError(
                        SignalErrorType.NO_PEER,
                        `Offer. No peer with id "${message.peerId}"`
                    );
                    return;
                }
                console.log(`Send offer from "${peerId}" to "${message.peerId}"`);
                peer.send({
                    type: 'offer',
                    peerId: peerId,
                    offer: message.offer
                } as OfferMessage);
            },
            answer: (message: AnswerMessage) => {
                const peer = channel.peers.get(message.peerId);
                if (!peer) {
                    sendError(
                        SignalErrorType.NO_PEER,
                        `Answer. No peer with id "${message.peerId}"`
                    );
                    return;
                }
                console.log(`Send answer from "${peerId}" to "${message.peerId}"`);
                peer.send({
                    type: 'answer',
                    peerId: peerId,
                    answer: message.answer
                } as AnswerMessage);
            },
            iceCandidate: (message: IceCandidateMessage) => {
                const peer = channel.peers.get(message.peerId);
                if (!peer) {
                    sendError(
                        SignalErrorType.NO_PEER,
                        `ICE Candidate. No peer with id "${message.peerId}"`
                    );
                    return;
                }
                console.log(`Send candidate from "${peerId}" to "${message.peerId}"`);
                message.peerId = peerId;
                peer.send(message);
            }
        };

        const handler = (handlers as any)[data.type];

        if (handler) {
            handler(data);
        }
    });

    ws.on('close', () => {
        console.log(`Peer "${peerId}" disconnected`);
        channel.peers.delete(peerId);
        channel.peers.forEach((peer) => {
            peer.send({
                type: 'online',
                peerId: peerId,
                online: false
            } as OnlineMesage);
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const server = new Turn({
    authMech: 'none'
});

server.start();
