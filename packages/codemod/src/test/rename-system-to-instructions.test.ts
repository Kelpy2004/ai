import { describe, it } from 'vitest';
import transformer from '../codemods/v7/rename-system-to-instructions';
import { testTransform } from './test-utils';

describe('rename-system-to-instructions', () => {
  it('renames system to instructions on AI SDK call options only', () => {
    testTransform(transformer, 'rename-system-to-instructions');
  });

  it('leaves files that do not import from the AI SDK untouched', () => {
    testTransform(transformer, 'rename-system-to-instructions-unrelated');
  });
});
