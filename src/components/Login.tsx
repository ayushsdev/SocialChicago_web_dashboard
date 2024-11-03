'use client';

import { useState } from 'react';
import { useAuth, } from '@/contexts/AuthContext';
import { getMultiFactorResolver, MultiFactorError, MultiFactorResolver } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';


export default function Login() {
  const { signInWithGoogle, handleMFAVerification, verifyMFACode } = useAuth();
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      if (error instanceof FirebaseError && error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
        setMfaResolver(resolver);
        try {
          const verId = await handleMFAVerification(resolver);
          setVerificationId(verId);
        } catch (error) {
          setError('Failed to send verification code');
          console.error(error);
        }
      } else {
        setError('Failed to sign in with Google');
        console.error(error);
      }
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver || !verificationId) return;

    try {
      await verifyMFACode(mfaResolver, verificationCode);
      setMfaResolver(null);
      setVerificationCode('');
      setVerificationId(null);
    } catch (error) {
      setError('Invalid verification code');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Sign in to your account</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {mfaResolver ? (
          <form onSubmit={handleMFASubmit} className="space-y-6">
            <div>
              <label htmlFor="verification-code" className="block text-sm font-medium text-foreground">
                Verification Code
              </label>
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-foreground"
                placeholder="Enter verification code"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Verify
            </button>
          </form>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
};