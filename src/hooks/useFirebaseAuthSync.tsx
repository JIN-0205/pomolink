import firebaseApp from "@/lib/firebase";
import { useAuth } from "@clerk/nextjs";
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import { useEffect, useState } from "react";

export function useFirebaseAuthSync() {
  const { getToken, isSignedIn } = useAuth();
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const sync = async () => {
      if (!isSignedIn) return;
      const token = await getToken({ template: "integration_firebase" });
      if (!token) return;
      const auth = getAuth(firebaseApp);
      await signInWithCustomToken(auth, token);
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) setFirebaseReady(true);
      });
    };
    sync();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [getToken, isSignedIn]);

  return firebaseReady;
}
