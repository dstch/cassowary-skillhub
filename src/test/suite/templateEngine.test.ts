import * as assert from 'assert';
import { TemplateEngine } from '../../services/TemplateEngine';

suite('TemplateEngine Test Suite', () => {
  let engine: TemplateEngine;

  setup(() => {
    engine = new TemplateEngine();
  });

  test('should list built-in templates', () => {
    const templates = engine.listTemplates();
    assert.ok(templates.length > 0);
  });

  test('should have code-review template', () => {
    const templates = engine.listTemplates();
    const codeReview = templates.find(t => t.id === 'code-review');
    assert.ok(codeReview);
    assert.strictEqual(codeReview.name, 'Code Review');
  });

  test('should have debugging template', () => {
    const templates = engine.listTemplates();
    const debugging = templates.find(t => t.id === 'debugging');
    assert.ok(debugging);
  });

  test('should have documentation template', () => {
    const templates = engine.listTemplates();
    const documentation = templates.find(t => t.id === 'documentation');
    assert.ok(documentation);
  });

  test('should have testing template', () => {
    const templates = engine.listTemplates();
    const testing = templates.find(t => t.id === 'testing');
    assert.ok(testing);
  });
});
