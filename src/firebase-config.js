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
    username: "admin",
    password: "admin123",
    fullName: "Administrador"
  }
};

export function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
