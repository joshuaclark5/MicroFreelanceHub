const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const componentPath = path.join(__dirname, '..', 'app', 'components', 'WelcomeWizard.tsx');
const source = fs.readFileSync(componentPath, 'utf8');
const sourceFile = ts.createSourceFile(componentPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const inputsById = new Set();
const labelsByText = new Map();

function getStringAttribute(element, name) {
  const attribute = element.attributes.properties.find(property =>
    ts.isJsxAttribute(property) && property.name.getText(sourceFile) === name
  );
  return attribute && attribute.initializer && ts.isStringLiteral(attribute.initializer)
    ? attribute.initializer.text
    : null;
}

function visit(node) {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    const tagName = node.tagName.getText(sourceFile);
    if (tagName === 'input') {
      const id = getStringAttribute(node, 'id');
      if (id) inputsById.add(id);
    }
  }

  if (ts.isJsxElement(node) && node.openingElement.tagName.getText(sourceFile) === 'label') {
    const text = node.children
      .filter(ts.isJsxText)
      .map(child => child.text.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' ');
    const htmlFor = getStringAttribute(node.openingElement, 'htmlFor');
    if (text) labelsByText.set(text, [...(labelsByText.get(text) || []), htmlFor]);
  }

  ts.forEachChild(node, visit);
}

visit(sourceFile);

for (const labelText of ['Your Name', 'Business Name or Job Title']) {
  const matches = labelsByText.get(labelText) || [];
  assert.equal(matches.length, 1, `Expected exactly one label: ${labelText}`);
  assert.ok(matches[0], `Label must have htmlFor: ${labelText}`);
  assert.ok(inputsById.has(matches[0]), `Label target input must exist: ${labelText}`);
}

console.log('PASS: onboarding name fields have associated labels and inputs');
