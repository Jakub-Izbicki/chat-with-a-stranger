import LobbyGuest from "./LobbyGuest";
import moment, {Moment} from "moment";

export default class SignalingGuestsPair {

    public readonly creationDate: Moment;

    constructor(readonly first: LobbyGuest,
                readonly second: LobbyGuest) {
        this.creationDate = moment();
    }

    public contains(guestId: string): boolean {
        return this.first.id === guestId || this.second.id === guestId;
    }

    public getOther(guestId: string): LobbyGuest {
        if (this.first.id === guestId) {
            return this.second;
        } else if (this.second.id === guestId) {
            return this.first
        } else {
            throw "Provided guest id did not match any guest in this pair";
        }
    }
}

