// "Fale com a IA" exists only where the model is configured. Until then the
// menu item, the home card and the page itself stay hidden (decided
// 09/11/2026), so nobody meets a chat that cannot answer.
export const aiChatEnabled = () => Boolean(process.env.OPENAI_API_KEY);
