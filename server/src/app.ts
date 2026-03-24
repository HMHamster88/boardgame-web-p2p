import express from 'express';
import { configDotenv } from 'dotenv';
import history from 'connect-history-api-fallback';

configDotenv();

const app = express();
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

app.listen(port, () => {
    console.log(`Static server is running on port ${port}`);
});

if (process.env.MQTT) {
    import('./mqtt').then((module) => {
        module.default();
    });
}

if (process.env.TURN) {
    import('./turn').then((module) => {
        module.default();
    });
}
