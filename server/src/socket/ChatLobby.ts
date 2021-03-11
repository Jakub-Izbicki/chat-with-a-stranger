import logger from "@shared/Logger";
import LobbyGuest from "./LobbyGuest";
import SignalingGuestsPair from "./SignalingGuestsPair";

export default class ChatLobby {

    private readonly MATCH_EVENT = "match";

    private readonly OFFER_REQUEST_EVENT = "offer-request";

    private readonly OFFER_EVENT = "offer";

    private readonly ANSWER_EVENT = "answer";

    private readonly ICE_EVENT = "icecandidate";

    private readonly PAIR_CONNECTED_EVENT = "pairconnected";

    private waitingGuests = new Array<LobbyGuest>();

    private signalingGuests = new Array<SignalingGuestsPair>();

    public addToLobby(newGuest: LobbyGuest): void {
        newGuest.socket.on("disconnect", () => {
            logger.info(`Connection closed: ${newGuest.id}`);
            this.removeGuestFromLobby(newGuest);
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
        // todo: this.removeTimeoutedSignalingGuests();
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
        offeringGuest.socket.on(this.OFFER_EVENT, (offer) => {
            answeringGuest.socket.emit(this.OFFER_EVENT, offer);
        });
        this.addIceCandidateEvent(offeringGuest, answeringGuest);
        this.addPairConnectedEvent(offeringGuest);
    }

    private addAnsweringGuestEvents(answeringGuest: LobbyGuest, offeringGuest: LobbyGuest): void {
        answeringGuest.socket.on(this.ANSWER_EVENT, (offer) => {
            offeringGuest.socket.emit(this.ANSWER_EVENT, offer);
        });
        this.addIceCandidateEvent(answeringGuest, offeringGuest);
        this.addPairConnectedEvent(answeringGuest);
    }

    private addIceCandidateEvent(sendingGuest: LobbyGuest, receivingGuest: LobbyGuest): void {
        sendingGuest.socket.on(this.ICE_EVENT, (icecandidate) => {
            receivingGuest.socket.emit(this.ICE_EVENT, icecandidate);
        });
    }

    private addPairConnectedEvent(sendingGuest: LobbyGuest): void {
        sendingGuest.socket.on(this.PAIR_CONNECTED_EVENT, () => {
            this.removeGuestFromLobby(sendingGuest);
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

        logger.info(`Remaining in lobby: ${this.waitingGuests.map(g => g.id).join(", ")}`)
        logger.info(`Remaining in signaling: ${this.signalingGuests.map(p => `[${p.first.id}, ${p.second.id}]`).join(", ")}`)
    }
}
