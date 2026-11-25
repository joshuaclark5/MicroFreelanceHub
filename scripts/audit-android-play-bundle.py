import zipfile, json, re, base64, hashlib, subprocess
from pathlib import Path
apk=Path('mobile/android/app/build/outputs/apk/release/app-release.apk')
config=json.loads(Path('mobile/app.json').read_text())['expo']
badging=subprocess.check_output(['C:/Users/joshu/mfh-android-tools/sdk/build-tools/36.0.0/aapt2.exe','dump','badging',str(apk)],text=True)
expected="package: name='com.microfreelancehub.mobile' versionCode='"+str(config['android']['versionCode'])+"' versionName='"+config['version']+"'"
assert expected in badging, 'APK version does not match current candidate; wait for completed build'
with zipfile.ZipFile(apk) as z:
    names=z.namelist()
    bundle=z.read('assets/index.android.bundle')
    assert b'https://rjgttmwrbyjqifodjnqm.supabase.co' in bundle, 'Expected public backend missing'
    for marker in [b'Privacy & account requests', b'No request was sent.', b'dark-content']:
        assert marker in bundle, 'Updated account-help/status-bar code missing'
    old_label=bytes.fromhex('c383c692c382c2a2c383e280a6c3a2e282acc593c383c2a2c3a2e2809ac2acc385e2809c').decode('utf8')
    assert all(old_label.encode(encoding) not in bundle for encoding in ['utf8','utf-16le']), 'Old garbled label remains in native bundle'
    old_label=bytes.fromhex('c383c692c3a2e282acc5a1c383e2809ac382c2b7').decode('utf8')
    assert all(old_label.encode(encoding) not in bundle for encoding in ['utf8','utf-16le']), 'Old garbled label remains in native bundle'
    for label in [b'Create account on website', b'Recover email password on website', b'Open project (website)', b'Explore your workspace', b'Open web workspace', b'Customer booking link']:
        assert all(label.decode('ascii').encode(encoding) not in bundle for encoding in ['utf8','utf-16le']), 'Direct website navigation remains in Play package'
    assert b'For email-password recovery, contact' in bundle, 'Play companion code missing'
    assert b'admin@microfreelancehub.com' in bundle, 'Monitored account-request address missing'
    assert b'support@microfreelancehub.com' not in bundle, 'Unverified support address remains'
    for marker in [b'Retry same operation', b'Clients, projects & tasks', b'Record completeness could not be verified']:
        assert marker in bundle, 'Native workspace implementation missing'
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
            assert claims.get('ref')=='rjgttmwrbyjqifodjnqm','Public backend key project mismatch'
    assert 'anon' in roles, 'Public anon credential not found'
    assert not re.search(rb'(?:sk_live_|sk_test_|sb_secret_)[A-Za-z0-9]{20,}',bundle), 'Server credential pattern detected'
    assert any(n.startswith('lib/arm64-v8a/') for n in names)
    assert any(n.startswith('lib/x86_64/') for n in names)
    assert not any(n.endswith(('.jks','.keystore','.env.local','signing.json')) for n in names),'Private signing/config included'
    report={'distribution':'play','webShortcutLabelsAbsent':True,'publicBackendVerified':True,'jwtRoles':sorted(set(roles)),'architectures':['arm64-v8a','x86_64'],'privateCredentialPatternsFound':False,'bundleSha256':hashlib.sha256(bundle).hexdigest()}
with zipfile.ZipFile('mobile/android/app/build/outputs/bundle/release/app-release.aab') as z:
    assert z.read('base/assets/index.android.bundle') == bundle, 'AAB and APK JavaScript differ'
    assert not any(n.endswith(('.jks','.keystore','.env.local','signing.json')) for n in z.namelist()), 'Private signing/config included in AAB'
report['aabBundleMatchesApk']=True
Path('artifacts/android-0.1.9-bundle-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
