import { describe, it, expect } from 'vitest';
import { MongoDBStorage } from './mongodb-storage';

describe('MongoDBStorage', () => {
  it('should instantiate without errors', () => {
    expect(() => new MongoDBStorage()).not.toThrow();
  });
});
