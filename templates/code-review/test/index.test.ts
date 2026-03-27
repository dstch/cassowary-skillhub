import { execute } from '../src/index';

describe('Code Review Skill', () => {
  it('should review a file', async () => {
    const result = await execute({
      command: 'review',
      params: { filePath: 'test.ts' }
    });
    expect(result.success).toBe(true);
  });
});