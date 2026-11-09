export default {
  name: "privacy",
  category: "Chat & Privacy",
  description: "Explain the privacy safeguards in this public FEI XMD build.",
  run: async ctx => {
    await ctx.reply(
      "🔒 *FEI XMD PRIVACY*\n\n" +
      "• This public build does not add group-chat history collection or member activity rankings.\n" +
      "• Message-specific commands run only when someone invokes them on a message.\n" +
      "• Welcome and goodbye greetings are off by default and store settings, not chat history.\n" +
      "• Automatic status viewing, status reactions, read-receipt controls and view-once recovery are not included."
    );
  }
};
