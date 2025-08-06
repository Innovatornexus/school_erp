import { describe, it, expect } from 'vitest';
import { DatabaseStorage } from './storage';

describe('DatabaseStorage', () => {
  it('should instantiate without errors', () => {
    expect(() => new DatabaseStorage()).not.toThrow();
  });
});
