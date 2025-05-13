// import { firebaseAuth } from "@/lib/firebase";
// import { useAuth } from "@clerk/nextjs";
// import { signInWithCustomToken } from "firebase/auth";
// import { useEffect } from "react";

// export function useFirebaseAuthSync() {
//   const { userId, getToken } = useAuth();

//   useEffect(() => {
//     if (!userId) {
//       // Clerk からログアウト → Firebase もログアウト
//       firebaseAuth.signOut();
//       return;
//     }
//     (async () => {
//       try {
//         const firebaseToken = await getToken({
//           template: "integration_firebase",
//         });
//         if (firebaseToken) {
//           await signInWithCustomToken(firebaseAuth, firebaseToken);
//           console.log("Firebase ログイン成功:", firebaseAuth.currentUser?.uid);
//         }
//       } catch (err) {
//         console.error("Firebase カスタムトークンログイン失敗:", err);
//       }
//     })();
//   }, [userId, getToken]);
// }
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
