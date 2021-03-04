import {Socket} from "socket.io";

export default class LobbyGuest {

    constructor(readonly id: string,
                readonly socket: Socket) {
    }
}
