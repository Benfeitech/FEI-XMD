export default {
  name: "privacy",
  category: "Chat & Privacy",
  description: "Explain the privacy safeguards in this public FEI XMD build.",
  run: async ctx => {
    await ctx.reply(
      "🔒 *FEI XMD PRIVACY*\n\n" +
      "• This public build does not add group-chat history collection or member activity rankings.\n" +
      "• Message-specific commands run only when someone invokes them on a message.\n      • Anti-delete is off by default; when enabled, it keeps a bounded, short-lived in-memory cache for that chat.\n      • Anti-delete never caches view-once messages.\n" +
      "• Welcome and goodbye greetings are off by default and store settings, not chat history.\n" +
      "• Automatic status viewing and reactions are owner-controlled; read-receipt controls are not included.\n      • The .vv and .vv2 commands only run when explicitly invoked as a reply to view-once media."
    );
  }
};
