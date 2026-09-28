// Lightweight auth module using Firebase Web SDK v10 modular APIs
// Works even if config is empty: falls back to mock sign-in for demo

(function () {
    const global = window;

    function loadFirebase() {
        return !!global.firebaseAppLoaded;
    }

    function initFirebase() {
        if (loadFirebase()) return global._sflxFirebase;

        // Expect Firebase SDK scripts to be loaded in HTML via <script type="module"> or CDN compat
        // We'll support CDN compat namespaces: firebase, firebase.initializeApp, firebase.auth
        if (global.firebase && global.firebase.initializeApp) {
            const cfg = global.SFLX_AUTH_CONFIG || {};
            if (!cfg.apiKey) {
                return null; // no real backend configured
            }
            try {
                const app = global.firebase.initializeApp(cfg);
                const auth = global.firebase.auth();
                global.firebaseAppLoaded = true;
                global._sflxFirebase = { app, auth };
                return global._sflxFirebase;
            } catch (e) {
                console.warn('Firebase init failed:', e);
                return null;
            }
        }
        // Modular v10+ path via import maps is not supported in plain script here
        return null;
    }

    function mockUser(provider) {
        const uid = 'mock_' + provider + '_' + Math.random().toString(36).slice(2, 8);
        return {
            uid,
            displayName: provider === 'github' ? 'GitHub User' : 'Google User',
            email: provider === 'github' ? 'user@github.local' : 'user@gmail.local',
            provider,
        };
    }

    async function signInWithProvider(provider) {
        const fb = initFirebase();
        const cfg = (window.SFLX_AUTH_CONFIG || {});
        const demo = cfg && cfg.demoMode !== false; // 默认 demo 模式开启
        // If Firebase not configured or demoMode, use mock path for demo
        if (demo || !fb || !fb.auth) {
            return { user: mockUser(provider), isMock: true };
        }

        // Use compat API from CDN: firebase.auth.GoogleAuthProvider / GithubAuthProvider
        try {
            let prov;
            if (provider === 'google') {
                prov = new firebase.auth.GoogleAuthProvider();
                prov.addScope('email');
            } else if (provider === 'github') {
                prov = new firebase.auth.GithubAuthProvider();
                const scopes = (global.SFLX_GITHUB_SCOPES || []);
                scopes.forEach(s => prov.addScope(s));
            } else {
                throw new Error('Unsupported provider: ' + provider);
            }
            const result = await fb.auth.signInWithPopup(prov);
            return { user: result.user, isMock: false };
        } catch (err) {
            console.error('OAuth sign-in failed:', err);
            throw err;
        }
    }

    function saveSession(user) {
        sessionStorage.setItem('isLoggedIn', 'true');
        const username = user.displayName || user.email || user.uid || 'user';
        sessionStorage.setItem('currentUser', username);
    }

    async function loginWithGoogle() {
        const { user } = await signInWithProvider('google');
        saveSession(user);
        return user;
    }

    async function loginWithGithub() {
        const { user } = await signInWithProvider('github');
        saveSession(user);
        return user;
    }

    global.SFLX_AUTH = {
        loginWithGoogle,
        loginWithGithub,
        initFirebase,
    };
})();


