import SocketPing from "@/domain/SocketPing";
import EventDataChannel from "@/domain/EventDataChannel";

export default class PeerPing extends SocketPing {

    public static readonly PING_RESPONSE_TAG = "-RTC PEER PING RESPONSE-";

    private static readonly PING_TAG = "-RTC PEER PING-";

    constructor(readonly dataChannel: EventDataChannel, timeoutCallback: Function) {
        // @ts-ignore
        super(null, timeoutCallback);
    }

    // eslint-disable-next-line
    public static isPingMsg(data: any): boolean {
        return typeof data === "string" && !!data.length && data.startsWith(PeerPing.PING_TAG);
    }

    // eslint-disable-next-line
    public static isPingResponseMsg(data: any): boolean {
        return typeof data === "string" && !!data.length && data.startsWith(PeerPing.PING_RESPONSE_TAG);
    }

    protected addListeners() {
        this.dataChannel.addEventListener("peerPingRequest", (event) => {
            const token = this.extractPingToken((event as MessageEvent).data);
            this.dataChannel.send(PeerPing.PING_RESPONSE_TAG + token);
        });

        this.dataChannel.addEventListener("peerPingResponse", (event) => {
            this.resetPing(this.extractPingResponseToken((event as MessageEvent).data));
        });
    }

    protected getPingName(): string {
        return "peer";
    }

    protected emitPing(): void {
        this.dataChannel.send(PeerPing.PING_TAG + this.pingToken);
    }

    private extractPingToken(pingMsg: string): string {
        return pingMsg.replace(PeerPing.PING_TAG, "");
    }

    private extractPingResponseToken(pingMsg: string): string {
        return pingMsg.replace(PeerPing.PING_RESPONSE_TAG, "");
    }
}
