const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const context={exports:{},TextEncoder,require:name=>{
 if(name==='fast-text-encoding')return {};
 if(name==='expo-crypto')return {getRandomValues:array=>crypto.webcrypto.getRandomValues(array),CryptoDigestAlgorithm:{SHA256:'SHA-256'},digest:(algorithm,data)=>crypto.webcrypto.subtle.digest(algorithm,data)};
 throw Error(name);
}};
vm.createContext(context);vm.runInContext(ts.transpileModule(fs.readFileSync('mobile/src/nativeCrypto.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
(async()=>{
 const verifier='dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
 const digest=await context.crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 assert.equal(Buffer.from(digest).toString('base64url'),'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
 assert.ok(context.crypto.getRandomValues(new Uint8Array(32)).some(v=>v!==0));
 await assert.rejects(context.crypto.subtle.digest('MD5',new Uint8Array(1)));
 console.log('PASS native crypto adapter: RFC7636 S256 vector, secure randomness delegation and unsupported digest rejection. Native Expo implementation still requires device verification.');
})().catch(e=>{console.error(e);process.exitCode=1});
