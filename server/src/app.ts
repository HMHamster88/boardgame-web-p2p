import express from 'express';
import { configDotenv } from 'dotenv';
import history from 'connect-history-api-fallback';
import Turn from 'node-turn';
import { Aedes } from 'aedes'
import { createServer } from 'aedes-server-factory'

configDotenv();

const app = express()
const port = process.env.PORT ?? 8000;
const mqttPort = process.env.MQTT_PORT ?? 8888

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

Aedes.createBroker().then(aedes => {
    console.log('Aedes created')
    const httpServer = createServer(aedes, { ws: true })
    httpServer.listen(mqttPort, function () {
        console.log('websocket server listening on port ', mqttPort)
    })
})

const server = new Turn({
    authMech: 'none'
});

server.start();
