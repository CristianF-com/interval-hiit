// Adaptador mínimo de Firebase para INHIIT (se empaqueta en fb.js con esbuild).
// La app solo usa window.FBA; así se puede reemplazar por un simulador en las pruebas.
import { initializeApp } from 'firebase/app';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserPopupRedirectResolver,
  onAuthStateChanged, signInAnonymously, EmailAuthProvider, GoogleAuthProvider,
  linkWithCredential, linkWithPopup, signInWithEmailAndPassword, signInWithPopup,
  sendPasswordResetEmail, signOut
} from 'firebase/auth';
import { getFirestore, doc, getDoc, writeBatch } from 'firebase/firestore/lite';

let app, auth, db;
const userInfo = u => u ? { uid: u.uid, anon: u.isAnonymous, email: u.email || (u.providerData[0] && u.providerData[0].email) || '', provider: (u.providerData[0] && u.providerData[0].providerId) || (u.isAnonymous ? 'anonymous' : '') } : null;

window.FBA = {
  init(cfg, onUser) {
    app = initializeApp(cfg);
    auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence], popupRedirectResolver: browserPopupRedirectResolver });
    auth.languageCode = (document.documentElement.lang || 'es').slice(0, 2);
    db = getFirestore(app);
    onAuthStateChanged(auth, u => onUser(userInfo(u)));
  },
  user: () => userInfo(auth && auth.currentUser),
  signInAnon: () => signInAnonymously(auth).then(r => userInfo(r.user)),
  linkEmail: (e, p) => linkWithCredential(auth.currentUser, EmailAuthProvider.credential(e, p)).then(r => userInfo(r.user)),
  signInEmail: (e, p) => signInWithEmailAndPassword(auth, e, p).then(r => userInfo(r.user)),
  linkGoogle: () => linkWithPopup(auth.currentUser, new GoogleAuthProvider()).then(r => userInfo(r.user)),
  signInGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()).then(r => userInfo(r.user)),
  resetPass: e => sendPasswordResetEmail(auth, e),
  signOut: () => signOut(auth),
  async getMeta(uid) { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? s.data() : null; },
  // cada copia se guarda en partes: users/{uid}/parts/{pre}{i} (pre = '' en las copias viejas, 'a' o 'b' en las nuevas)
  async getParts(uid, n, pre = '') {
    const out = [];
    for (let i = 0; i < n; i++) { const s = await getDoc(doc(db, 'users', uid, 'parts', pre + i)); out.push(s.exists() ? s.data().d : ''); }
    return out;
  },
  // escribe todas las partes y el resumen juntos (o todo o nada); borra partes sobrantes de una copia anterior más grande en ese mismo lugar
  async putAll(uid, meta, parts, oldN, pre = '') {
    const b = writeBatch(db);
    parts.forEach((d, i) => b.set(doc(db, 'users', uid, 'parts', pre + i), { d }));
    for (let i = parts.length; i < (oldN || 0); i++) b.delete(doc(db, 'users', uid, 'parts', pre + i));
    b.set(doc(db, 'users', uid), meta);
    await b.commit();
  }
};
window.dispatchEvent(new Event('fba-ready'));
