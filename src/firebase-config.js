export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export const appSettings = {
  usernameEmailDomain: "icfes.local",
  localAdmin: {
    username: import.meta.env.VITE_LOCAL_ADMIN_USERNAME || "LOCALADMIN",
    password: import.meta.env.VITE_LOCAL_ADMIN_PASSWORD || "CHANGE_ME",
    fullName: import.meta.env.VITE_LOCAL_ADMIN_NAME || "Administrador"
  }
};

export function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
