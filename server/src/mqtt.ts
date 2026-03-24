import { Aedes } from 'aedes';
import { createServer } from 'aedes-server-factory';

const mqttPort = process.env.MQTT_PORT ?? 8888;

export default function start() {
    Aedes.createBroker().then((aedes) => {
        const httpServer = createServer(aedes, { ws: true });
        httpServer.listen(mqttPort, function () {
            console.log(`MQTT websocket server listening on port ${mqttPort}`);
        });
    });
}
