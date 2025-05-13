// import { App, cert, getApps, initializeApp } from "firebase-admin/app";
// import { getDownloadURL, getStorage } from "firebase-admin/storage";

// let app: App | undefined;

// if (!getApps().length) {
//   app = initializeApp({
//     credential: cert({
//       projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//       clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(
//         /\\n/g,
//         "\n"
//       ),
//     }),
//     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   });
// } else {
//   app = getApps()[0];
// }

// export { app, getDownloadURL, getStorage };

import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
} else {
  adminApp = getApps()[0];
}

export { adminApp, getStorage };
