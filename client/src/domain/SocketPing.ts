import {v4 as uuid4} from "uuid";
import {Socket} from "socket.io-client";

export default class SocketPing {

    private readonly PING_TIMEOUT = 2000;

    private readonly PING_INTERVAL = 1000;

    private pingTimeout: number | null = null;

    private pingInterval: number | null = null;

    private pingToken: string | null = null;

    constructor(readonly socket: Socket, readonly timeoutCallback: Function) {
    }

    public start(): void {
        this.sendPing();
    }

    public stop(): void {
        this.stopSignalingPing();
    }

    private sendPing(): void {
        if (this.pingInterval) {
            clearTimeout(this.pingInterval);
        }

        this.pingToken = uuid4();
        console.info(`Sending ping: ${this.pingToken}`);
        this.socket?.emit("signalingPingRequest", this.pingToken);
        this.socket?.off("signalingPingResponse", (token: string) => this.resetSignalingPing(token));
        this.socket?.on("signalingPingResponse", (token: string) => this.resetSignalingPing(token));

        this.pingTimeout = setTimeout(() => this.timeoutCallback(), this.PING_TIMEOUT);
    }

    private resetSignalingPing(token: string): void {
        console.info(`Received ping token: ${token}`);
        if (this.pingToken === token) {
            clearTimeout(this.pingTimeout as number);
            this.pingInterval = setTimeout(() => this.sendPing(), this.PING_INTERVAL);
        }
    }

    private stopSignalingPing(): void {
        if (this.pingInterval) {
            clearTimeout(this.pingInterval);
        }
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
        }
    }
}
