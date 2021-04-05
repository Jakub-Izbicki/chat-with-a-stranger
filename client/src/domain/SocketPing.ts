import {v4 as uuid4} from "uuid";
import {Socket} from "socket.io-client";
// import Logger from "@/domain/Logger";

export default class SocketPing {

    private readonly PING_TIMEOUT = 2000;

    private readonly PING_INTERVAL = 1000;

    protected pingToken: string | null = null;

    private pingTimeout: number | null = null;

    private pingInterval: number | null = null;

    constructor(readonly socket: Socket, readonly timeoutCallback: Function) {
    }

    public start(): void {
        this.addListeners();
        this.sendPing();
    }

    public stop(): void {
        this.stopPing();
    }

    protected addListeners() {
        this.socket?.on("signalingPingRequest", (token: string) => {
            this.socket?.emit("signalingPingResponse", token);
        });

        this.socket?.on("signalingPingResponse", (token: string) => this.resetPing(token));
    }

    // protected getPingName(): string {
    //     return "signaling";
    // }

    protected emitPing(): void {
        this.socket?.emit("signalingPingRequest", this.pingToken);
    }

    protected resetPing(token: string): void {
        // Logger.info(`Received ${this.getPingName()} ping token: ${token}`);
        if (this.pingToken === token) {
            clearTimeout(this.pingTimeout as number);
            this.pingInterval = setTimeout(() => this.sendPing(), this.PING_INTERVAL);
        }
    }

    private sendPing(): void {
        if (this.pingInterval) {
            clearTimeout(this.pingInterval);
        }

        this.pingToken = uuid4();
        // Logger.info(`Sending ${this.getPingName()} ping: ${this.pingToken}`);
        this.emitPing();

        this.pingTimeout = setTimeout(() => this.timeoutCallback(), this.PING_TIMEOUT);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearTimeout(this.pingInterval);
        }
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
    }
}
