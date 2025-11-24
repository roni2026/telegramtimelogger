import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import express from "express";
import { logEvent } from "./logger.js";

dotenv.config();

// --- Telegram bot setup ---
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// --- Function to detect login/logout events ---
function detectEvent(text) {
  if (!text) return null;
  text = text.toLowerCase();
  const pattern = /^(m|d|e|se|n|m1|d1|e1|se1|n1)\s*[- ]?\s*(login|logout)/;
  const match = text.match(pattern);
  if (!match) return null;
  return match[2] === "login" ? "LOGIN" : "LOGOUT";
}

// --- Telegram message listener ---
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const agent = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim();
  const text = msg.text || "";
  const eventType = detectEvent(text);

  let attachment = null;

  try {
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
  } catch (err) {
    console.error("Error fetching attachment:", err);
  }

  if (eventType) {
    try {
      await logEvent({
        agent,
        eventType,
        message: text,
        attachment,
      });
      bot.sendMessage(chatId, `✔ ${agent} ${eventType} logged`);
    } catch (err) {
      console.error("Error logging event:", err);
      bot.sendMessage(chatId, `⚠ Failed to log your ${eventType}`);
    }
  }
});

// --- Express server for Render ---
const app = express();

app.get("/", (req, res) => res.send("Telegram bot is running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express server listening on port ${PORT}`));
