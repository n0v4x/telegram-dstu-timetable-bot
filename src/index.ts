import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";

dotenv.config();

const token = process.env.TELEGRAM_API_TOKEN || "";

const bot = new TelegramBot(token, { polling: true });

bot.on("text", (message) => {
  // message.
  bot.sendMessage(message.chat.id, "Hello world");
});
