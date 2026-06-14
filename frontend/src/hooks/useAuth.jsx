import { useState, useEffect, createContext, useContext } from 'react';
import { auth } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    auth.ben()
      .then(r => setUser(r.data))
      .catch(() => setUser(null));
  }, []);

  const giris = async (data) => {
    const r = await auth.giris(data);
    setUser(r.data);
  };

  const kayit = async (data) => {
    const r = await auth.kayit(data);
    setUser(r.data);
  };

  const cikis = async () => {
    await auth.cikis();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, giris, kayit, cikis }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
