import {Server} from "http";
import {Server as Io, Socket} from "socket.io"
import logger from "@shared/Logger";

const intervals: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();

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

export default function useWebsocket(server: Server) {
    const io = new Io(server, getServerOptions());

    io.on("connection", socket => {
        const connection = socket as Socket;
        logger.info(`Connection established: ${connection.id}`);

        const interval = setInterval(() => {
            logger.info(`Sending ping to: ${connection.id}`);
            connection.emit("ping", "Hello world");
        }, 1000);

        intervals.set(connection.id, interval);

        connection.on("disconnect", () => {
            logger.info(`Connection closed: ${connection.id}`);
            const interval = intervals.get(connection.id);

            if (interval) {
                intervals.delete(connection.id);
                clearInterval(interval);
            }
        })
    });

}
