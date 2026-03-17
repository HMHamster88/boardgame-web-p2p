interface ImportMetaEnv {
    readonly VITE_STUN_SERVER_URL: string;

    readonly VITE_SIGNAL_WS_URL: string;
    readonly VITE_P2P_CHANNEL_NAME: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}