import PeerPing from "@/domain/PeerPing";

export default class EventDataChannel extends EventTarget {

    private readonly onOpen = () => {
        this.dispatchEvent(new MessageEvent("open", {}));
    };

    private readonly onClose = () => {
        this.dispatchEvent(new MessageEvent("close", {}));
    };

    private readonly onMessage = (event: MessageEvent) => {
        if (PeerPing.isPingMsg(event.data)) {
            this.dispatchEvent(new MessageEvent("peerPingRequest", {data: event.data}));
        } else if (PeerPing.isPingResponseMsg(event.data)) {
            this.dispatchEvent(new MessageEvent("peerPingResponse", {data: event.data}));
        } else {
            this.dispatchEvent(new MessageEvent("chatMessage", {data: event.data}));
        }
    };

    constructor(readonly dataChannel: RTCDataChannel) {
        super();
        dataChannel.addEventListener("open", this.onOpen);
        dataChannel.addEventListener("close", this.onClose);
        dataChannel.addEventListener("message", this.onMessage);
    }

    public send(msg: string): void {
        this.dataChannel.send(msg);
    }

    public close(): void {
        this.dataChannel.removeEventListener("open", this.onOpen);
        this.dataChannel.removeEventListener("close", this.onClose);
        this.dataChannel.removeEventListener("message", this.onMessage);
        this.dataChannel.close();
    }
}
