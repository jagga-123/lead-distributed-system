import mongoose from 'mongoose';

const RETRYABLE_MESSAGE_FRAGMENTS = [
  'TransientTransactionError',
  'UnknownTransactionCommitResult',
  'Write conflict during plan execution',
  'write conflict',
  'Please retry your operation',
  'yielding is disabled',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableTransactionError(error) {
  const message = error?.message || '';

  if (typeof error?.hasErrorLabel === 'function') {
    if (error.hasErrorLabel('TransientTransactionError') || error.hasErrorLabel('UnknownTransactionCommitResult')) {
      return true;
    }
  }

  return RETRYABLE_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment));
}

export async function runTransactionWithRetry(work, options = {}) {
  const {
    maxRetries = 5,
    baseDelayMs = 50,
    onRetry,
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const result = await work(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      lastError = error;

      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
      } catch {
        // Ignore abort cleanup errors; original error matters more.
      }

      if (!isRetryableTransactionError(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delayMs = baseDelayMs * (2 ** attempt);
      if (onRetry) {
        onRetry(error, attempt + 1, delayMs);
      }
      await sleep(delayMs);
    } finally {
      session.endSession();
    }
  }

  throw lastError;
}
