import TelegramBot, {
  Message,
  Metadata,
  SendMessageOptions,
  SendPhotoOptions
} from "node-telegram-bot-api";

export interface BotConstructorOptions {
  polling?: boolean;
}

export type Listener = (msg: Message, meta: Metadata) => void;

export type ChatId = string | number;

export default class Bot {
  private _telegramBot: TelegramBot;

  constructor(token: string, { polling }: BotConstructorOptions) {
    this._telegramBot = new TelegramBot(token, { polling, filepath: false });
  }

  public onText(listener: Listener): void {
    this._telegramBot.on("text", listener);
  }

  public async sendMsg(
    chatId: ChatId,
    text: string,
    options?: SendMessageOptions
  ): Promise<Message> {
    return this._telegramBot.sendMessage(chatId, text, options);
  }

  public async sendMarkdown(chatId: ChatId, text: string): Promise<Message> {
    return this.sendMsg(chatId, text, {
      parse_mode: "Markdown"
    });
  }

  public async sendPhoto(
    chatId: ChatId,
    photo: Buffer,
    options?: SendPhotoOptions
  ): Promise<Message> {
    return this._telegramBot.sendPhoto(chatId, photo, options);
  }
}
