/** Single place server actions report a swallowed error, so failures are visible in logs. */
export function logError(scope: string, e: unknown): void {
  console.error(`[${scope}]`, e);
}
