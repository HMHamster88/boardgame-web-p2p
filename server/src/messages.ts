export interface SignalMessage {
    type: string;
}

export interface OfferMessage extends SignalMessage {
    type: 'offer';
    peerId: string;
    offer: any;
}

export interface AnswerMessage extends SignalMessage {
    type: 'answer';
    peerId: string;
    answer: any;
}

export interface OnlineMesage extends SignalMessage {
    type: 'online';
    peerId: string;
    online: boolean;
}

export interface PeersListMessage extends SignalMessage {
    type: 'peersList';
    peers: string[];
}

export interface IceCandidateMessage extends SignalMessage {
    type: 'iceCandidate';
    peerId: string;
    candidate: any;
}

export enum SignalErrorType {
    PEER_ALREADY_CONNECTED,
    NO_PEER
}

export interface SignalErrorMessage extends SignalMessage {
    type: 'error';
    errorType: SignalErrorType;
    message: string;
}
