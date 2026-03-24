import Turn from 'node-turn';

const turnPort = Number.parseInt(process.env.TURN_PORT ?? '3478');

export default function start() {
    const server = new Turn({
        authMech: 'none',
        listeningPort: turnPort
    });

    server.start();

    console.log(`Turn server started on port ${turnPort}`);
}
