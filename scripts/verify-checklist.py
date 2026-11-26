"""Read-only verification of immutable specification and sole requirement inventory."""
from pathlib import Path
from hashlib import sha256
import json
import re

root = Path(__file__).resolve().parents[1]
base = root / 'docs/checklist'
inventory = json.loads((base / 'requirements.json').read_text(encoding='utf-8'))
master = (base / inventory['source']['file']).read_bytes()
assert sha256(master).hexdigest() == inventory['source']['sha256'], 'Master changed'
assert b''.join((base / p['file']).read_bytes() for p in inventory['sourceParts']) == master, 'Sections not lossless'
for part in inventory['sourceParts']:
    assert sha256((base / part['file']).read_bytes()).hexdigest() == part['sha256'], part['file']
text = master.decode('utf-8-sig')
matches = list(re.finditer(r'^\[ \] ((?:G00|M\d{2})-\d{3})  (.+)$', text, re.M))
assert len(matches) == text.count('[ ]') == 1220
items = inventory['requirements']
assert len(items) == len({r['id'] for r in items}) == 1220
assert [r['id'] for r in items] == [m[1] for m in matches]
allowed = {'Unverified', 'Existing verified', 'Partial', 'Missing', 'Blocked', 'Deferred', 'Implemented in staging', 'Published verified'}
for item, match in zip(items, matches):
    assert item['text'] == match[2].rstrip('\r')
    assert item['sourceLine'] == match[0].rstrip('\r')
    assert item['status'] in allowed
    assert isinstance(item['checked'], bool)
    if item['checked']:
        assert item['status'] in {'Existing verified', 'Implemented in staging', 'Published verified'}
        assert item['verification'], 'Checked requirement needs evidence'
for module in inventory['modules']:
    assert sum(r['module'] == module['id'] for r in items) == module['expectedCount']
coverage = re.findall(r'^([FA]\d{2}) \| (.+?) \| (M[^\r\n]+)', text, re.M)
assert len(coverage) == len({x[0] for x in coverage}) == 113
assert inventory['coverage'] == [{'id': i, 'description': d, 'modules': m.split(', ')} for i, d, m in coverage]
print(json.dumps({'masterSha256': inventory['source']['sha256'], 'requirements': 1220,
                  'modules': len(inventory['modules']) - 1, 'coverageEntries': 113,
                  'sourceParts': len(inventory['sourceParts']), 'status': 'passed'}))
