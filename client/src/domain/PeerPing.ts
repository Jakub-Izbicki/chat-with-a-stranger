import SocketPing from "@/domain/SocketPing";

export default class PeerPing extends SocketPing {

    public static readonly PING_RESPONSE_TAG = "-RTC PEER PING RESPONSE-";

    private static readonly PING_TAG = "-RTC PEER PING-";

    constructor(readonly dataChannel: RTCDataChannel, timeoutCallback: Function) {
        // @ts-ignore
        super(null, timeoutCallback);
    }

    public reset(token: string): void {
        this.resetPing(token);
    }

    // eslint-disable-next-line
    public static isPingMsg(data: any): boolean {
        return typeof data === "string" && !!data.length && data.startsWith(PeerPing.PING_TAG);
    }

    // eslint-disable-next-line
    public static isPingResponseMsg(data: any): boolean {
        return typeof data === "string" && !!data.length && data.startsWith(PeerPing.PING_RESPONSE_TAG);
    }

    public static extractPingToken(pingMsg: string): string {
        return pingMsg.replace(PeerPing.PING_TAG, "");
    }

    public static extractPingResponseToken(pingMsg: string): string {
        return pingMsg.replace(PeerPing.PING_RESPONSE_TAG, "");
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
}
