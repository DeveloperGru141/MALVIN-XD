const { ademola, fakevCard } = require("../ademola");
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../data/userGroupData.json");

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getConfig() {
  const data = loadData();
  if (!data.autoreply) data.autoreply = { enabled: false, message: "I'm currently away. I'll get back to you soon!" };
  return data.autoreply;
}

function setConfig(config) {
  const data = loadData();
  data.autoreply = config;
  saveData(data);
}

ademola({
  pattern: "autoreply",
  alias: ["away", "automsg"],
  desc: "Auto-reply to private messages when away",
  category: "settings",
  react: "🤖",
  use: ".autoreply on/off/set <message>",
  filename: __filename,
}, async (ademola, mek, m, { from, q, reply, isOwner }) => {
  if (!isOwner) return reply("❌ Only the owner can use this command.");

  if (!q) {
    const config = getConfig();
    const status = config.enabled ? "✅ ON" : "❌ OFF";
    return reply(`*Auto Reply*\n\nStatus: ${status}\nMessage: ${config.message}\n\n*Usage:*\n.autoreply on — Enable\n.autoreply off — Disable\n.autoreply set <message> — Custom message`);
  }

  const [cmd, ...args] = q.split(" ");
  const lower = cmd.toLowerCase();

  if (lower === "on") {
    const config = getConfig();
    config.enabled = true;
    setConfig(config);
    return reply("✅ Auto-reply enabled! Private messages will get an automatic response.");
  }

  if (lower === "off") {
    const config = getConfig();
    config.enabled = false;
    setConfig(config);
    return reply("❌ Auto-reply disabled.");
  }

  if (lower === "set") {
    const msg = args.join(" ");
    if (!msg) return reply("⚠️ Please provide a message. Example: .autoreply set I'm busy right now.");
    const config = getConfig();
    config.message = msg;
    setConfig(config);
    return reply(`✅ Auto-reply message set to:\n> ${msg}`);
  }

  return reply("❌ Invalid. Use: .autoreply on/off/set <message>");
});

module.exports = { getConfig };