import {v4 as uuid4} from "uuid";

export class LogMsg {

    private static COUNT = 0;

    readonly id: string;

    readonly index: number;

    constructor(readonly msg: string) {
        this.id = uuid4();
        this.index = LogMsg.COUNT++;
    }
}

export default class Logger {

    private static INSTANCE: Logger | null = null;

    private messages = new Array<LogMsg>();

    public static getInstance(): Logger {
        if (!Logger.INSTANCE) {
            Logger.INSTANCE = new Logger();
        }

        return Logger.INSTANCE;
    }

    public static info(msg: string): void {
        this.getInstance().log(msg);
    }

    public log(msg: string): void {
        console.info(msg);
        this.messages.unshift(new LogMsg(msg));
    }

    public getMessages(): LogMsg[] {
        return this.messages;
    }
}
