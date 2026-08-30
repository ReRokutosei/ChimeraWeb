import { describe, expect, it } from 'vitest';
import { settleInInputOrder } from '../src/components/FileDrop';

describe('file loading order', () => {
  it('preserves input order when decoding completes out of order', async () => {
    const resolvers: Array<(value: string) => void> = [];
    const resultPromise = settleInInputOrder(['first', 'second', 'third'], item => (
      new Promise<string>(resolve => {
        resolvers.push(() => resolve(item));
      })
    ));

    resolvers[2]('third');
    resolvers[0]('first');
    resolvers[1]('second');

    await expect(resultPromise).resolves.toEqual([
      { status: 'fulfilled', value: 'first' },
      { status: 'fulfilled', value: 'second' },
      { status: 'fulfilled', value: 'third' },
    ]);
  });

  it('keeps remaining results ordered when one decode fails', async () => {
    const results = await settleInInputOrder(['first', 'bad', 'third'], async item => {
      if (item === 'bad') throw new Error('decode failed');
      return item;
    });

    expect(results[0]).toEqual({ status: 'fulfilled', value: 'first' });
    expect(results[1].status).toBe('rejected');
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'third' });
  });
});
