import * as assert from 'assert';
import { SkillCreationAgent } from '../../agent/SkillCreationAgent';

suite('SkillCreationAgent Test Suite', () => {
  let agent: SkillCreationAgent;

  setup(() => {
    agent = new SkillCreationAgent();
  });

  test('should initialize with welcome message', () => {
    agent.start();
    const conversation = agent.getConversation();
    assert.ok(conversation.length > 0);
    assert.strictEqual(conversation[0].role, 'agent');
  });

  test('should have idle status initially', () => {
    agent.start();
    assert.strictEqual(agent.getStatus(), 'idle');
  });

  test('should return null preview initially', () => {
    agent.start();
    assert.strictEqual(agent.getPreview(), null);
  });

  test('should reset state on cancel', () => {
    agent.start();
    agent.cancel();
    assert.strictEqual(agent.getStatus(), 'idle');
    assert.strictEqual(agent.getConversation().length, 0);
  });
});
