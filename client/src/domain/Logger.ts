import {v4 as uuid4} from "uuid";

export class LogMsg {

    private static COUNT = 0;

    readonly id: string;

    readonly index: number;

    constructor(readonly msg: string,
                readonly color: string) {
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
        Logger.log(new LogMsg(msg, "log-info"));
    }

    public static success(msg: string): void {
        Logger.log(new LogMsg(msg, "log-success"));
    }

    public static warn(msg: string): void {
        Logger.log(new LogMsg(msg, "log-warn"));
    }

    public static error(msg: string): void {
        Logger.log(new LogMsg(msg, "log-error"));
    }

    private static log(msg: LogMsg): void {
        console.info(msg.msg);
        Logger.getInstance().messages.unshift(msg);
    }

    public getMessages(): LogMsg[] {
        return this.messages;
    }
}
