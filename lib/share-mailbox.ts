type ShareMailboxMessage = { to: string; subject: string; text: string; createdAt: string };
const messages: ShareMailboxMessage[] = [];

export function captureShareInvitation(message: Omit<ShareMailboxMessage, "createdAt">) { messages.push({ ...message, createdAt: new Date().toISOString() }); }
export function readShareInvitations(to?: string) { return messages.filter((message) => !to || message.to === to).map((message) => ({ ...message })); }
export function clearShareMailbox() { messages.length = 0; }
