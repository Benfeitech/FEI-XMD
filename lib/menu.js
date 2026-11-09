export function buildMenu({ commands = [], config = {}, theme = {} } = {}) {
  const menu = theme.menu || {};
  const sections = Array.isArray(theme.sections) ? theme.sections : [];
  const prefix = String(config.prefix || ".");
  const lines = [
    String(menu.top || "╭━━〔 ") + String(config.name || "FEI XMD") + String(menu.titleEnd || " 〕━━┈⊷"),
    String(menu.infoLine || "┃ ✫ ") + "Version: " + String(config.version || "1.0.0"),
    String(menu.infoLine || "┃ ✫ ") + "Prefix: " + prefix,
    String(menu.blankLine || "┃")
  ];

  if (!commands.length) {
    lines.push(String(menu.infoLine || "┃ ✫ ") + "Command modules are being prepared.");
  } else {
    const assigned = new Set();
    for (const section of sections) {
      const members = commands.filter(command => {
        if (assigned.has(command.name)) return false;
        return command.category === section.key;
      });
      if (!members.length) continue;
      lines.push(String(section.title || section.key));
      for (const command of members) {
        assigned.add(command.name);
        lines.push(
          String(menu.itemLine || "┃ ✫✧│ ") + prefix + command.name +
          (command.description ? " — " + command.description : "")
        );
      }
      lines.push(String(menu.blankLine || "┃"));
    }

    const ungrouped = commands.filter(command => !assigned.has(command.name));
    if (ungrouped.length) {
      lines.push("OTHER");
      for (const command of ungrouped) {
        lines.push(String(menu.itemLine || "┃ ✫✧│ ") + prefix + command.name);
      }
    }
  }

  lines.push(String(menu.bottom || "╰━━━━━━━━━━━━┈⊷"));
  lines.push("⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴇɴꜰᴇɪ ᴛᴇᴄʜ");
  return lines.join("\n");
}
