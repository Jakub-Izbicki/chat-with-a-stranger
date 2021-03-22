export default class Logger {

    private static INSTANCE: Logger | null = null;

    private messages = new Array<string>();

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
        this.messages.push(msg);
    }

    public getMessages(): Array<string> {
        return this.messages;
    }
}
