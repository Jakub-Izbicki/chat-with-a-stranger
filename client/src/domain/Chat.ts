import {io, Socket} from "socket.io-client";
import {v4 as uuid4} from "uuid";
import {ChatState} from "@/domain/ChatState";
import SocketPing from "@/domain/SocketPing";
import PeerPing from "@/domain/PeerPing";
import EventDataChannel from "@/domain/EventDataChannel";
import Logger from "@/domain/Logger";

export default class Chat extends EventTarget {

    private static readonly CONNECT = "connect";

    private static readonly DISCONNECT = "disconnect";

    private static readonly MATCH = "match";

    private static readonly OFFER_REQUEST = "offer-request";

    private static readonly OFFER = "offer";

    private static readonly ANSWER = "answer";

    private static readonly ICECANDIDATE = "icecandidate";

    private socket: Socket | null = null;

    private peerConnection: RTCPeerConnection | null = null;

    private dataChannel: EventDataChannel | null = null;

    private socketPing: SocketPing | null = null;

    private peerPing: PeerPing | null = null;

    public state = ChatState.IDLE;

    constructor(readonly name: string) {
        super();
    }

    public enterChat(): void {
        this.initSocket();
        this.initPeerConnection();

        this.socket?.on(Chat.CONNECT, () => {
            Logger.warn(`${this.name} - Entered lobby. My id: ${this.socket?.id}`);
        });

        this.socket?.on(Chat.DISCONNECT, () => {
            if (this.state !== ChatState.READY_TO_CHAT) {
                this.leaveChat("socket disconnect");
            }
        });

        this.socket?.on(Chat.MATCH, (matchId: string) => {
            Logger.success(`${this.name} - Matched with id: ${matchId}`);
            this.state = ChatState.SIGNALING;

            this.socketPing = new SocketPing(this.socket as Socket, () => this.leaveChat(`${this.name} - socket ping timeout`));
            this.socketPing.start();
        });

        this.socket?.on(Chat.OFFER_REQUEST, async () => {
            Logger.info(`${this.name} - Creating data channel`);
            const dataChannel = (this.peerConnection as RTCPeerConnection).createDataChannel(`dataChannel-${uuid4()}`);
            this.dataChannel = new EventDataChannel(dataChannel);
            this.addDataChannelEvents();

            Logger.info(`${this.name} - Creating offer`);
            const offer = await this.peerConnection?.createOffer();
            await this.peerConnection?.setLocalDescription(offer as RTCSessionDescriptionInit);
            this.socket?.emit("offer", offer as RTCSessionDescriptionInit);
        });

        this.socket?.on(Chat.OFFER, async (offer: RTCSessionDescriptionInit) => {
            Logger.info(`${this.name} - Received offer`);
            this.peerConnection?.setRemoteDescription(offer);
            const answer = await this.peerConnection?.createAnswer();
            await this.peerConnection?.setLocalDescription(answer as RTCSessionDescriptionInit);
            this.socket?.emit("answer", answer as RTCSessionDescriptionInit);
        });

        this.socket?.on(Chat.ANSWER, async (answer: RTCSessionDescriptionInit) => {
            Logger.info(`${this.name} - Received answer`);
            await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
        });

        this.socket?.on(Chat.ICECANDIDATE, async (icecandidate: RTCIceCandidate) => {
            Logger.info(`${this.name} - Received icecandidate`);
            await this.peerConnection?.addIceCandidate(icecandidate);
        });
    }

    private doLeaveChat(reason: string): void {
        Logger.error(`${this.name} - Leaving chat, reason: ${reason}`);
        this.socketPing?.stop();
        this.socketPing = null;
        this.peerPing?.stop();
        this.peerPing = null;
        this.removeSocketListeners();
        this.socket?.disconnect();
        this.socket = null;
        this.peerConnection?.close();
        this.peerConnection = null;
        this.dataChannel?.close();
        this.dataChannel = null;
        this.state = ChatState.IDLE;
    }

    private initSocket(): void {
        if (this.getSocketUrl()) {
            this.socket = io(this.getSocketUrl() as string);
        } else {
            this.socket = io();
        }

        this.state = ChatState.SEARCHING;
    }

    private getSocketUrl(): string | null {
        if (process.env.NODE_ENV !== "production") {
            return "http://localhost:3000";
        } else {
            return null;
        }
    }

    private initPeerConnection(): void {
        this.peerConnection = new RTCPeerConnection(
            {"iceServers": [{'urls': 'stun:stun.l.google.com:19302'}]});

        this.peerConnection.addEventListener("icecandidate", event => {
            if (event.candidate) {
                Logger.info(`${this.name} - Sending icecandidate`);
                this.socket?.emit("icecandidate", event.candidate);
            }
        });

        this.peerConnection.addEventListener("connectionstatechange", () => {
            if (this.peerConnection?.connectionState === "connected") {
                Logger.info(`${this.name} - Peers connected`);
                if (this.state !== ChatState.DATA_CHANNEL_OPEN) {
                    this.state = ChatState.PEERS_CONNECTED;
                } else {
                    this.onReadyToChat();
                }
            }
        });

        this.peerConnection.addEventListener("datachannel", (event: RTCDataChannelEvent) => {
            Logger.info(`${this.name} - Data channel received`);
            this.dataChannel = new EventDataChannel(event.channel);
            this.addDataChannelEvents();
        });
    }

    private onReadyToChat() {
        Logger.success(`${this.name} - Ready to chat`);
        this.state = ChatState.READY_TO_CHAT;
        (this.socketPing as SocketPing).stop();
        this.socketPing = null;
        this.removeSocketListeners();
        // todo: think of some way to correctly disconnect when signaling channel is no longer needed
        // this.socket?.disconnect();
        this.socket = null;
        this.peerPing = new PeerPing(this.dataChannel as EventDataChannel,
            () => this.leaveChat(`${this.name} - peer ping timeout`));
        this.peerPing.start();
    }

    private addDataChannelEvents(): void {
        // todo: remove listeners when leaving chat
        this.dataChannel?.addEventListener("open", () => {
            Logger.info(`${this.name} - Data channel open`);
            if (this.state !== ChatState.PEERS_CONNECTED) {
                this.state = ChatState.DATA_CHANNEL_OPEN;
            } else {
                this.onReadyToChat();
            }
            this.dataChannel?.send("Hello world!");
        });

        this.dataChannel?.addEventListener("close", () => {
            this.leaveChat("data channel closed");
        });

        this.dataChannel?.addEventListener("chatMessage", (event) => {
            Logger.info(`${this.name} - ${(event as MessageEvent).data}`);
        });
    }

    private leaveChat(reason: string): void {
        this.doLeaveChat(reason);
        this.dispatchEvent(new MessageEvent("leave"));
        // this.enterChat();
    }

    private removeSocketListeners() {
        this.socketListenerOff(Chat.CONNECT);
        this.socketListenerOff(Chat.DISCONNECT);
        this.socketListenerOff(Chat.MATCH);
        this.socketListenerOff(Chat.OFFER_REQUEST);
        this.socketListenerOff(Chat.OFFER);
        this.socketListenerOff(Chat.ANSWER);
        this.socketListenerOff(Chat.ICECANDIDATE);
    }

    private socketListenerOff(event: string): void {
        if (!this.socket) {
            return;
        }

        this.socket.listeners(event).forEach(listener => {
            this.socket?.off(event, listener);
        });
    }
}
