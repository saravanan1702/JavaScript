/** Errors that retrying can't fix (bad data, policy refusal, unknown job type): no retries. */
export class PermanentError extends Error {}

/** "Not now": reschedule the job for `runAt` without using up a retry attempt. */
export class DeferError extends Error {
  constructor(message, runAt) {
    super(message);
    this.runAt = runAt;
  }
}
