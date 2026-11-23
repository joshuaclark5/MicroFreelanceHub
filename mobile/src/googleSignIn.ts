export const GOOGLE_CALLBACK = 'microfreelancehub://auth/callback';

export function googleCallbackCode(value: string): string {
 const url = new URL(value), expected = new URL(GOOGLE_CALLBACK);
 if (url.protocol !== expected.protocol || url.host !== expected.host || url.pathname !== expected.pathname || url.username || url.password || url.hash) {
  throw Error('Google sign-in returned an unexpected address. Please try again.');
 }
 if (url.searchParams.has('error') || url.searchParams.has('error_code')) throw Error('Google sign-in was not completed. Please try again.');
 const codes = url.searchParams.getAll('code');
 if (codes.length !== 1 || !codes[0].trim() || codes[0].length > 2048) throw Error('Google sign-in did not return a valid confirmation. Please try again.');
 return codes[0];
}

type AuthClient = {
 auth: {
  signInWithOAuth: (options: any) => Promise<any>;
  exchangeCodeForSession: (code: string) => Promise<any>;
 };
};
export async function googleSignIn(db: AuthClient, backend: string, open: (url: string, callback: string) => Promise<{type: string; url?: string}>) {
 const { data, error } = await db.auth.signInWithOAuth({provider: 'google', options: {redirectTo: GOOGLE_CALLBACK, skipBrowserRedirect: true, queryParams: {prompt: 'select_account'}}});
 if (error || !data?.url) throw Error('Could not start Google sign-in. Check your connection and retry.');
 const authorize = new URL(data.url);
 if (authorize.origin !== new URL(backend).origin || authorize.pathname !== '/auth/v1/authorize' || authorize.protocol !== 'https:') throw Error('Could not verify the sign-in address. Please retry.');
 if (authorize.searchParams.get('code_challenge_method')?.toLowerCase() !== 's256' || !authorize.searchParams.get('code_challenge')) throw Error('Secure sign-in is unavailable in this build. Please update the app.');
 const result = await open(authorize.toString(), GOOGLE_CALLBACK);
 if (result.type !== 'success') return false;
 if (!result.url) throw Error('Google sign-in did not return to the app. Please retry.');
 const code = googleCallbackCode(result.url);
 // Supabase verifies the single-use code against this attempt's in-memory PKCE
 // verifier. Never accept access/refresh tokens supplied by an arbitrary deep link.
 const exchange = await db.auth.exchangeCodeForSession(code);
 if (exchange.error || !exchange.data?.session?.user?.id) throw Error('Could not finish Google sign-in. Please start again.');
 return true;
}
