import "dotenv/config";

import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import config from "./config/bot.config.js";
import theme from "./config/theme.config.js";
import { loadCommands } from "./handlers/command-loader.js";
import { createWhatsAppRuntime } from "./lib/whatsapp-runtime.js";

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidPhone(value) {
  return /^\d{8,15}$/.test(normalizePhone(value));
}

export async function runLocalTerminal(options = {}) {
  const { commands, lookup } = await loadCommands();
  const sessionDirectory = path.resolve(String(
    options.sessionDirectory ||
    process.env.FEI_SESSION_DIR ||
    config.sessionDirectory
  ));

  const runtime = createWhatsAppRuntime({
    config,
    theme,
    commands,
    lookup,
    sessionDirectory
  });

  let shuttingDown = false;
  let rl = null;

  async function shutdown(signal = "") {
    if (shuttingDown) return;
    shuttingDown = true;
    if (signal) console.log("\nStopping FEI XMD (" + signal + ")...");
    if (rl) {
      rl.close();
      rl = null;
    }
    await runtime.stop().catch(error => {
      console.warn("Could not stop FEI XMD cleanly:", error && error.message || error);
    });
  }

  const onSigint = () => {
    void shutdown("SIGINT").finally(() => process.exit(0));
  };
  const onSigterm = () => {
    void shutdown("SIGTERM").finally(() => process.exit(0));
  };

  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);

  runtime.on("connected", status => {
    console.log("\nFEI XMD connected" + (status.phoneNumber ? " as " + status.phoneNumber : "") + ".");
    console.log("The runtime is ready. Command modules will be added in the next development step.");
  });
  runtime.on("reconnecting", info => {
    console.warn("WhatsApp connection closed. Reconnecting in " + info.delayMs + " ms...");
  });
  runtime.on("loggedOut", () => {
    console.error("This WhatsApp session was logged out. Remove the local auth folder and pair again.");
  });
  runtime.on("runtimeError", error => {
    console.error("FEI XMD runtime error:", error && error.message || error);
  });

  try {
    console.log("\n╭━━〔 FEI XMD · LOCAL RUNTIME 〕━━┈⊷");
    console.log("Baileys: @whiskeysockets/baileys (official npm package)");
    console.log("Session directory: " + sessionDirectory);
    console.log("Loaded " + commands.length + " command module(s).");
    console.log("Press Ctrl+C to stop the runtime.\n");

    await runtime.start();
    const status = runtime.getStatus();

    if (!status.paired && !status.connected) {
      let phoneNumber = normalizePhone(process.env.PAIRING_NUMBER || "");

      while (!shuttingDown && !phoneNumber) {
        rl = createInterface({ input: stdin, output: stdout });
        const answer = await rl.question(
          "Enter your WhatsApp number with country code (digits only, e.g. 2348012345678), or Q to cancel: "
        );
        rl.close();
        rl = null;

        if (String(answer || "").trim().toLowerCase() === "q") {
          await shutdown();
          return runtime;
        }

        if (!isValidPhone(answer)) {
          console.log("Invalid number. Include the country code and enter 8–15 digits.\n");
          continue;
        }
        phoneNumber = normalizePhone(answer);
      }

      if (!shuttingDown && phoneNumber) {
        const pairing = await runtime.requestPairingCode(phoneNumber);
        console.log("\n╭━━〔 YOUR WHATSAPP PAIRING CODE 〕━━┈⊷");
        console.log("                 " + pairing.code);
        console.log("╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈⊷");
        console.log("On your phone: WhatsApp → Linked devices → Link a device → Link with phone number instead.");
        console.log("Enter this code on WhatsApp. Keep it private.\n");
      }
    } else {
      console.log("An existing local WhatsApp session was found. Reconnecting without requesting another code...");
    }

    console.log("FEI XMD is running. Keep this process active while the WhatsApp session is connected.");
    return runtime;
  } catch (error) {
    await shutdown();
    throw error;
  }
}
