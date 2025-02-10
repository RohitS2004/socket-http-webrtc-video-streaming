import { WebSocket, WebSocketServer } from "ws";

export const all_sockets: WebSocket[] = []
const wss = new WebSocketServer({ port: 3000 });

wss.on("connection", (socket) => {

    console.log("Client has connected!");
    all_sockets.push(socket);

    socket.on("message", (message) => {

        // @ts-ignore
        const blob = new Blob([message], { type: 'video/x-matroska;codecs=avc1' })
        
        all_sockets.forEach(socket => {
            blob.arrayBuffer()
            .then((buffer_array) => {
                socket.send(buffer_array)
            })
        })

    })

    socket.onclose = () => {
        console.log("Client disconnected!")
    }
})