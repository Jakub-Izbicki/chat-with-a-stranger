import logger from "@shared/Logger";
import LobbyGuest from "./LobbyGuest";
import SignalingGuestsPair from "./SignalingGuestsPair";
import moment from "moment";

export default class ChatLobby {

    private readonly MATCH_EVENT = "match";

    private readonly SIGNALING_PING_REQUEST_EVENT = "signalingPingRequest";

    private readonly SIGNALING_PING_RESPONSE_EVENT = "signalingPingResponse";

    private readonly OFFER_REQUEST_EVENT = "offer-request";

    private readonly OFFER_EVENT = "offer";

    private readonly ANSWER_EVENT = "answer";

    private readonly ICE_EVENT = "icecandidate";

    private waitingGuests = new Array<LobbyGuest>();

    private signalingGuests = new Array<SignalingGuestsPair>();

    constructor() {
        setInterval(() => this.removeTimeoutedPairs(), 2000);
    }

    public addToLobby(newGuest: LobbyGuest): void {
        newGuest.socket.on("disconnect", () => {
            logger.info(`Connection closed: ${newGuest.id}`);
            this.removeGuestFromLobby(newGuest);
            this.logRemaining();
        });

        if (this.anyGuestAlreadyWaiting()) {
            const matchedGuest = this.waitingGuests.pop() as LobbyGuest;
            logger.info(`Matching ${newGuest.id} with ${matchedGuest.id}`);

            this.sentMatchAndBeginSignaling(newGuest, matchedGuest);
        } else {
            logger.info(`Placing ${newGuest.id} in lobby`);
            this.waitingGuests.push(newGuest);
        }

        this.validateWaitingGuests();
    }

    private removeTimeoutedPairs() {
        const latestDateAllowed = moment().subtract(5, "seconds");
        const isTimeouted = (pair: SignalingGuestsPair) => pair.creationDate.isBefore(latestDateAllowed);

        this.signalingGuests.filter(isTimeouted)
            .forEach(pair => {
                // method also removes second guest
                this.removeGuestFromLobby(pair.first);
            });

        this.logRemaining();
    }

    private removeGuestFromLobby(guest: LobbyGuest): void {
        if (this.isGuestInSignaling(guest.id)) {
            const pairToRemove =
                this.signalingGuests.find(pair => pair.contains(guest.id)) as SignalingGuestsPair;
            this.signalingGuests = this.signalingGuests.filter(pair => !pair.contains(guest.id));
            guest.socket.disconnect(true);
            pairToRemove.getOther(guest.id).socket.disconnect(true);
        } else {
            this.waitingGuests = this.waitingGuests.filter(g => g.id !== guest.id);
        }
    }

    private isGuestInSignaling(guestId: string): boolean {
        return this.signalingGuests.some(pair => pair.contains(guestId))
    }

    private anyGuestAlreadyWaiting(): boolean {
        return !!this.waitingGuests.length;
    }

    private sentMatchAndBeginSignaling(newGuest: LobbyGuest, matchedGuest: LobbyGuest): void {
        const pair = new SignalingGuestsPair(newGuest, matchedGuest);
        this.moveToSignaling(pair);
        this.addSignalingEvents(pair);
        this.sendMatch(pair);
        this.sentOfferRequest(pair.first);
    }

    private moveToSignaling(pair: SignalingGuestsPair) {
        this.waitingGuests = this.waitingGuests.filter(guest => guest.id !== pair.first.id);
        this.waitingGuests = this.waitingGuests.filter(guest => guest.id !== pair.second.id);
        this.signalingGuests.push(pair);
    }

    private addSignalingEvents(pair: SignalingGuestsPair): void {
        this.addOfferingGuestEvents(pair.first, pair.second);
        this.addAnsweringGuestEvents(pair.second, pair.first);
    }

    private addOfferingGuestEvents(offeringGuest: LobbyGuest, answeringGuest: LobbyGuest): void {
        this.addSignalingPingRequestEvent(offeringGuest, answeringGuest);
        this.addSignalingPingResponseEvent(offeringGuest, answeringGuest);
        offeringGuest.socket.on(this.OFFER_EVENT, (offer) => {
            answeringGuest.socket.emit(this.OFFER_EVENT, offer);
        });
        this.addIceCandidateEvent(offeringGuest, answeringGuest);
    }

    private addAnsweringGuestEvents(answeringGuest: LobbyGuest, offeringGuest: LobbyGuest): void {
        this.addSignalingPingRequestEvent(answeringGuest, offeringGuest);
        this.addSignalingPingResponseEvent(answeringGuest, offeringGuest);
        answeringGuest.socket.on(this.ANSWER_EVENT, (offer) => {
            offeringGuest.socket.emit(this.ANSWER_EVENT, offer);
        });
        this.addIceCandidateEvent(answeringGuest, offeringGuest);
    }

    private addSignalingPingRequestEvent(sendingGuest: LobbyGuest,
                                         receivingGuest: LobbyGuest): void {
        sendingGuest.socket.on(this.SIGNALING_PING_REQUEST_EVENT, (token) => {
            receivingGuest.socket.emit(this.SIGNALING_PING_REQUEST_EVENT, token);
        });
    }

    private addSignalingPingResponseEvent(sendingGuest: LobbyGuest,
                                          receivingGuest: LobbyGuest): void {
        sendingGuest.socket.on(this.SIGNALING_PING_RESPONSE_EVENT, (token) => {
            receivingGuest.socket.emit(this.SIGNALING_PING_RESPONSE_EVENT, token);
        });
    }

    private addIceCandidateEvent(sendingGuest: LobbyGuest, receivingGuest: LobbyGuest): void {
        sendingGuest.socket.on(this.ICE_EVENT, (icecandidate) => {
            receivingGuest.socket.emit(this.ICE_EVENT, icecandidate);
        });
    }

    private sendMatch(pair: SignalingGuestsPair) {
        pair.first.socket.emit(this.MATCH_EVENT, pair.second.id);
        pair.second.socket.emit(this.MATCH_EVENT, pair.first.id);
    }

    private sentOfferRequest(offeringGuest: LobbyGuest) {
        offeringGuest.socket.emit(this.OFFER_REQUEST_EVENT);
    }

    private validateWaitingGuests() {
        if (this.waitingGuests.length > 1) {
            const guests = this.waitingGuests.length;
            throw `Max number of guests waiting in lobby cannot be more that 1, was: ${guests}`;
        }
        this.logRemaining();
    }

    private logRemaining(): void {
        logger.info(`Remaining in lobby: ${this.waitingGuests.map(g => g.id).join(", ")}`)
        logger.info(`Remaining in signaling: ${this.signalingGuests.map(p => `[${p.first.id}, ${p.second.id}]`).join(", ")}`)
    }
}
