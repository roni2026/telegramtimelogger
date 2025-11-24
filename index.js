import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { logEvent } from "./logger.js";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

function detectEvent(text) {
  if (!text) return null;

  text = text.toLowerCase();

  const pattern = /^(m|d|e|se|n|m1|d1|e1|se1|n1)\s*[- ]?\s*(login|logout)/;

  const match = text.match(pattern);
  if (!match) return null;

  const type = match[2] === "login" ? "LOGIN" : "LOGOUT";
  return type;
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const agent =
    `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim();
  const text = msg.text || "";
  const eventType = detectEvent(text);

  // extract attachment URL if exists
  let attachment = null;

  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    attachment = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  }

  if (msg.document) {
    const fileId = msg.document.file_id;
    const file = await bot.getFile(fileId);
    attachment = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  }

  if (eventType) {
    await logEvent({
      agent,
      eventType,
      message: text,
      attachment,
    });

    bot.sendMessage(chatId, `✔ ${agent} ${eventType} logged`);
  }
});
