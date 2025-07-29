import { Server } from "node:http";


export const connectToSocket = (server) => {
    const io = new Server(server);

    return io;
};