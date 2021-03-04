import {Server as HttpServer} from "http";
import {Server, Socket} from "socket.io"
import logger from "@shared/Logger";
import ChatLobby from "./ChatLobby";
import LobbyGuest from "./LobbyGuest";

const chatLobby = new ChatLobby();

function getServerOptions() {
    if (process.env.NODE_ENV !== "production") {
        return {
            cors: {
                origin: "http://localhost:8080"
            }
        }
    } else {
        return {};
    }
}

export default function useWebsocket(server: HttpServer) {
    const io = new Server(server, getServerOptions());

    io.on("connection", socket => {
        logger.info(`Connection established: ${socket.id}`);

        chatLobby.addToLobby(new LobbyGuest(socket.id, socket as Socket));
    });
}
