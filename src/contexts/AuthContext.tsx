'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  MultiFactorResolver,
  RecaptchaVerifier,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  handleMFAVerification: (resolver: MultiFactorResolver) => Promise<string>;
  verifyMFACode: (resolver: MultiFactorResolver, verificationCode: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
        if (error instanceof FirebaseError && error.code === 'auth/multi-factor-auth-required') {
            throw error;
      }
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

    const handleMFAVerification = async (resolver: MultiFactorResolver) => {
        try {
            // Clean up any existing reCAPTCHA widgets and containers
            if (window.recaptchaVerifier) {
                await window.recaptchaVerifier.clear();
                window.recaptchaVerifier = undefined;
            }
            
            // Remove any existing recaptcha containers
            const oldContainer = document.getElementById('recaptcha-container');
            if (oldContainer) {
                oldContainer.remove();
            }
            
            // Create a new container
            const container = document.createElement('div');
            container.id = 'recaptcha-container';
            document.body.appendChild(container);
            
            // Create new RecaptchaVerifier instance
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {},
                'expired-callback': () => {}
            });
            
            window.recaptchaVerifier = recaptchaVerifier;

            // Render the reCAPTCHA widget
            await recaptchaVerifier.render();

            const phoneInfoOptions = {
                multiFactorHint: resolver.hints[0],
                session: resolver.session,
            };
            
            const phoneAuthProvider = new PhoneAuthProvider(auth);
            const verificationId = await phoneAuthProvider.verifyPhoneNumber(
                phoneInfoOptions, 
                recaptchaVerifier
            );

            // Clean up
            await recaptchaVerifier.clear();
            window.recaptchaVerifier = undefined;
            container.remove();
            
            return verificationId;
        } catch (error) {
            console.error('Error sending verification code:', error);
            throw error;
        }
    };

  const verifyMFACode = async (resolver: MultiFactorResolver, verificationCode: string) => {
    try {
      const phoneAuthCredential = PhoneAuthProvider.credential(
        await handleMFAVerification(resolver),
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
      await resolver.resolveSignIn(multiFactorAssertion);
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  };

  const signOut = () => auth.signOut();

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    handleMFAVerification,
    verifyMFACode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

