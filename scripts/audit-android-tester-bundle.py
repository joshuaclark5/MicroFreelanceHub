import zipfile, json, re, base64, hashlib
from pathlib import Path
apk=Path('mobile/android/app/build/outputs/apk/release/app-release.apk')
with zipfile.ZipFile(apk) as z:
    names=z.namelist()
    bundle=z.read('assets/index.android.bundle')
    assert b'https://rjgttmwrbyjqifodjnqm.supabase.co' in bundle, 'Expected public backend missing'
    roles=[]
    for token in re.findall(rb'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', bundle):
        try:
            payload=token.split(b'.')[1]
            claims=json.loads(base64.urlsafe_b64decode(payload+b'='*(-len(payload)%4)))
        except Exception:
            continue
        if 'role' in claims:
            roles.append(claims['role'])
            assert claims['role']=='anon','Nonpublic backend credential detected'
    assert 'anon' in roles, 'Public anon credential not found'
    assert not re.search(rb'(?:sk_live_|sk_test_|sb_secret_)[A-Za-z0-9]{20,}',bundle), 'Server credential pattern detected'
    assert any(n.startswith('lib/arm64-v8a/') for n in names)
    assert any(n.startswith('lib/x86_64/') for n in names)
    assert not any(n.endswith(('.jks','.keystore','.env.local','signing.json')) for n in names),'Private signing/config included'
    report={'publicBackendVerified':True,'jwtRoles':sorted(set(roles)),'architectures':['arm64-v8a','x86_64'],'privateCredentialPatternsFound':False,'bundleSha256':hashlib.sha256(bundle).hexdigest()}
Path('artifacts/android-0.1.5-bundle-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
