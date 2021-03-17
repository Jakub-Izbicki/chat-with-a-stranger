import {io, Socket} from "socket.io-client";
import {ChatState} from "@/domain/ChatState";
import {v4 as uuid4} from "uuid"
import SocketPing from "@/domain/SocketPing";

export default class Chat {

    private socket: Socket | null = null;

    private peerConnection: RTCPeerConnection | null = null;

    private dataChannel: RTCDataChannel | null = null;

    private signalingPing: SocketPing | null = null;

    public state = ChatState.IDLE;

    public enterChat(): void {
        this.initSocket();
        this.initPeerConnection();

        this.socket?.on("connect", () => {
            console.info(`Entered lobby. My id: ${this.socket?.id}`);
        });

        this.socket?.on("disconnect", () => {
            if (this.state !== ChatState.READY_TO_CHAT) {
                this.reenterChat();
            }
        });

        this.socket?.on("match", (matchId: string) => {
            console.info(`Matched with id: ${matchId}`);
            this.state = ChatState.SIGNALING;

            this.socket?.on("signalingPingRequest", (token: string) => {
                this.socket?.emit("signalingPingResponse", token);
            });

            this.signalingPing = new SocketPing(this.socket as Socket, () => this.leaveChat());
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

    public leaveChat(): void {
        console.info("Leaving chat");
        (this.signalingPing as SocketPing).stop();
        // todo: remove peer ping

        // todo: disconnect socket?
        this.socket = null;
        // todo: close peer connection?
        this.peerConnection = null;
        // todo close data channel?
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
                    // todo: add peer ping
                }

                //todo: remove this?
                // this.socket?.emit("pairconnected");

                this.socket = null;
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
                // todo: add peer ping
            }
            this.dataChannel?.send("Hello world!");
        });

        this.dataChannel?.addEventListener("close", () => {
            this.reenterChat();
        });

        this.dataChannel?.addEventListener("message", (event: MessageEvent) => {
            console.info(event.data);
        });
    }

    private reenterChat(): void {
        this.leaveChat();
        this.enterChat();
    }
}
