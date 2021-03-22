import SocketPing from "@/domain/SocketPing";
import EventDataChannel from "@/domain/EventDataChannel";

export default class PeerPing extends SocketPing {

    public static readonly PING_RESPONSE_TAG = "-RTC PEER PING RESPONSE-";

    private static readonly PING_TAG = "-RTC PEER PING-";

    constructor(readonly dataChannel: EventDataChannel, timeoutCallback: Function) {
        // @ts-ignore
        super(null, timeoutCallback);
        this.addListeners();
    }

    private addListeners() {
        this.dataChannel.addEventListener("peerPingRequest", (event) => {
            this.dataChannel.send(PeerPing.PING_RESPONSE_TAG + this.extractPingToken((event as MessageEvent).data));
        });

        this.dataChannel.addEventListener("peerPingResponse", (event) => {
            this.resetPing(this.extractPingResponseToken((event as MessageEvent).data));
        });
    }

    // eslint-disable-next-line
    public static isPingMsg(data: any): boolean {
        return typeof data === "string" && !!data.length && data.startsWith(PeerPing.PING_TAG);
    }

    // eslint-disable-next-line
    public static isPingResponseMsg(data: any): boolean {
        return typeof data === "string" && !!data.length && data.startsWith(PeerPing.PING_RESPONSE_TAG);
    }

    protected getPingName(): string {
        return "peer";
    }

    protected setResponseListener(): void {
        // do nothing
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
