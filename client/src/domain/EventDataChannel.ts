import PeerPing from "@/domain/PeerPing";

export default class EventDataChannel extends EventTarget {

    constructor(readonly dataChannel: RTCDataChannel) {
        super();

        dataChannel.addEventListener("open", () => {
            this.dispatchEvent(new MessageEvent("open", {}));
        });

        dataChannel.addEventListener("close", () => {
            this.dispatchEvent(new MessageEvent("close", {}));
        });

        dataChannel.addEventListener("message", (event: MessageEvent) => {
            if (PeerPing.isPingMsg(event.data)) {
                this.dispatchEvent(new MessageEvent("peerPingRequest", {data: event.data}));
            } else if (PeerPing.isPingResponseMsg(event.data)) {
                this.dispatchEvent(new MessageEvent("peerPingResponse", {data: event.data}));
            } else {
                this.dispatchEvent(new MessageEvent("chatMessage", {data: event.data}));
            }
        });
    }

    public send(msg: string): void {
        this.dataChannel.send(msg);
    }

    public close(): void {
        this.dataChannel.close();
    }
}
