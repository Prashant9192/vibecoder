export function ideLog(event: string, payload?: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  // Keep logging lightweight and focused on key IDE transitions
  // eslint-disable-next-line no-console
  console.log(`[IDE] ${event}`, payload ?? "");
}

