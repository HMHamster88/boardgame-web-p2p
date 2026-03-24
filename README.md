# Boardgame P2P

Web based boardgames app

To run:
```
npm install
npm run build
cd server
npm install
npm run start
```
# Server

You can use node based server from this repo ([Readme](server/README.md)) 

This app uses Web RTС, so you need only three things:
- Static server for js, css, images and other
- Signal server  
App uses MQTT broker for signaling, you can use any mqtt broker with websocket support (for example [Mosquitto](https://mosquitto.org/)). By default app uses ``ws://${location.hostname}:8888``
to use custom server change env var in .env file 
``VITE_SIGNAL_WS_URL=ws://192.168.0.4:9001``
- STUN/TURN server  
By default app uses ``stun:${location.hostname}:3478``
to use custom server change env var in .env file 
``VITE_SIGNAL_WS_URL=stun:stun1.l.google.com:19302``
