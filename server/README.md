# Server

This server contains:
 - **Static sever (express)**  
    Starts always
 - **MQTT server for RTC signaling (aedes)**  
    Starts if env var ``MQTT=true``
 - **STUN/TURN server (node-turn)**  
    Starts if env var ``TURN=true``

.env example

```
PORT=8080
MQTT=true
MQTT_PORT=8889
TURN=true
TURN_PORT=3479
```
## How to start server

```
npm install
npm run dev # for development
npm run start # for prod
```

## Build SEA

- Build front
- Run command:  
```
npm run build:all
```
Result in dist/sea