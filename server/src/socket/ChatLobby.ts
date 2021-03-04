import logger from "@shared/Logger";
import LobbyGuest from "./LobbyGuest";

export default class ChatLobby {

    private readonly MATCH_EVENT = "match";

    private lobbyGuests = new Array<LobbyGuest>();

    public addToLobby(newGuest: LobbyGuest): void {
        newGuest.socket.on("disconnect", () => {
            logger.info(`Connection closed: ${newGuest.id}`);
            this.lobbyGuests = this.lobbyGuests.filter(guest => guest.id !== newGuest.id);
        });

        if (this.anyGuestAlreadyWaiting()) {
            const matchedGuest = this.lobbyGuests.pop() as LobbyGuest;
            logger.info(`Matching ${newGuest.id} with ${matchedGuest.id}`);

            this.sentMatchAndDisconnect(newGuest, matchedGuest);
            this.sentMatchAndDisconnect(matchedGuest, newGuest);
        } else {
            logger.info(`Placing ${newGuest.id} in lobby`);
            this.lobbyGuests.push(newGuest);
        }

        if (this.lobbyGuests.length > 1) {
            const guests = this.lobbyGuests.length;
            throw `Max number of guests waiting in lobby cannot be more that 1, was: ${guests}`;
        }

    }

    private anyGuestAlreadyWaiting(): boolean {
        return !!this.lobbyGuests.length;
    }

    private sentMatchAndDisconnect(sendTo: LobbyGuest, match: LobbyGuest): void {
        sendTo.socket.emit(this.MATCH_EVENT, match.id);
        sendTo.socket.disconnect(true);
    }
}
