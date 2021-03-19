import {io, Socket} from "socket.io-client";
import {ChatState} from "@/domain/ChatState";
import SocketPing from "@/domain/SocketPing";
import PeerPing from "@/domain/PeerPing";

export default class Chat {

    private socket: Socket | null = null;

    private peerConnection: RTCPeerConnection | null = null;

    private dataChannel: RTCDataChannel | null = null;

    private signalingPing: SocketPing | null = null;

    private peerPing: PeerPing | null = null;

    public state = ChatState.IDLE;

    public enterChat(): void {
        this.initSocket();
        this.initPeerConnection();

        this.socket?.on("connect", () => {
            console.info(`Entered lobby. My id: ${this.socket?.id}`);
        });

        this.socket?.on("disconnect", () => {
            if (this.state !== ChatState.READY_TO_CHAT) {
                this.reenterChat("socket disconnect");
            }
        });

        this.socket?.on("match", (matchId: string) => {
            console.info(`Matched with id: ${matchId}`);
            this.state = ChatState.SIGNALING;

            this.socket?.on("signalingPingRequest", (token: string) => {
                this.socket?.emit("signalingPingResponse", token);
            });

            this.signalingPing = new SocketPing(this.socket as Socket, () => this.reenterChat("socket ping timeout"));
            this.signalingPing.start();
        });

        this.socket?.on("offer-request", async () => {
            console.info("Creating data channel");
            this.dataChannel = (this.peerConnection as RTCPeerConnection).createDataChannel("dataChannel");
            this.addDataChannelEvents();

            console.info("Creating offer");
            const offer = await this.peerConnection?.createOffer();
            await this.peerConnection?.setLocalDescription(offer as RTCSessionDescriptionInit);
            this.socket?.emit("offer", offer as RTCSessionDescriptionInit);
        });

        this.socket?.on("offer", async (offer: RTCSessionDescriptionInit) => {
            console.info("Received offer");
            this.peerConnection?.setRemoteDescription(offer);
            const answer = await this.peerConnection?.createAnswer();
            await this.peerConnection?.setLocalDescription(answer as RTCSessionDescriptionInit);
            this.socket?.emit("answer", answer as RTCSessionDescriptionInit);
        });

        this.socket?.on("answer", async (answer: RTCSessionDescriptionInit) => {
            console.info(`Received answer`);
            await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
        });

        this.socket?.on("icecandidate", async (icecandidate: RTCIceCandidate) => {
            console.info(`Received icecandidate`);
            await this.peerConnection?.addIceCandidate(icecandidate);
        });
    }

    public leaveChat(reason: string): void {
        console.info(`Leaving chat, reason: ${reason}`);
        this.signalingPing?.stop();
        this.signalingPing = null;
        this.peerPing?.stop();
        this.peerPing = null;

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
                console.info("Sending icecandidate");
                this.socket?.emit("icecandidate", event.candidate);
            }
        });

        this.peerConnection.addEventListener("connectionstatechange", () => {
            if (this.peerConnection?.connectionState === "connected") {
                console.info("Pair connected");
                if (this.state !== ChatState.DATA_CHANNEL_OPEN) {
                    this.state = ChatState.PEERS_CONNECTED;
                } else {
                    this.state = ChatState.READY_TO_CHAT;
                    (this.signalingPing as SocketPing).stop();
                    this.signalingPing = null;
                    this.socket?.disconnect();
                    this.socket = null;
                    this.peerPing = new PeerPing(this.dataChannel as RTCDataChannel, () => this.reenterChat("peer ping timeout"));
                    this.peerPing.start();
                }

                //todo: remove this?
                // this.socket?.emit("pairconnected");
                // this.socket = null;
            }
        });

        this.peerConnection.addEventListener("datachannel", (event: RTCDataChannelEvent) => {
            this.dataChannel = event.channel;
            this.addDataChannelEvents();
        });
    }

    private addDataChannelEvents(): void {
        this.dataChannel?.addEventListener("open", () => {
            if (this.state !== ChatState.PEERS_CONNECTED) {
                this.state = ChatState.DATA_CHANNEL_OPEN;
            } else {
                this.state = ChatState.READY_TO_CHAT;
                (this.signalingPing as SocketPing).stop();
                this.signalingPing = null;
                this.socket?.disconnect();
                this.socket = null;
                this.peerPing = new PeerPing(this.dataChannel as RTCDataChannel, () => this.reenterChat("peer ping timeout"));
                this.peerPing.start();
            }
            this.dataChannel?.send("Hello world!");
        });

        this.dataChannel?.addEventListener("close", () => {
            this.reenterChat("data channel closed");
        });

        this.dataChannel?.addEventListener("message", (event: MessageEvent) => {
            if (PeerPing.isPingMsg(event.data)) {
                (this.dataChannel as RTCDataChannel)
                    .send(PeerPing.PING_RESPONSE_TAG + PeerPing.extractPingToken(event.data));
            } else if (PeerPing.isPingResponseMsg(event.data)) {
                (this.peerPing as PeerPing).reset(PeerPing.extractPingResponseToken(event.data));
            } else {
                console.info(event.data);
            }
        });
    }

    private reenterChat(reason: string): void {
        this.leaveChat(reason);
        this.enterChat();
    }
}
