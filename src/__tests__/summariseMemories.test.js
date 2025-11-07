import { describe, expect, it } from 'vitest';

import { summariseMemories } from '../utils/summariseMemories.js';

describe('summariseMemories', () => {
  it('returns a fallback summary when no API key provided', async () => {
    const memories = [
      { name: 'Amina', message: 'May Allah bless you with joy.' },
      { name: 'Hashim', message: 'Warmest congratulations.' },
    ];

    const result = await summariseMemories(memories);
    expect(result).toContain('Collected');
    expect(result).toContain('Amina');
  });

  it('handles empty memories gracefully', async () => {
    const result = await summariseMemories([]);
    expect(result).toBe('');
  });
});
