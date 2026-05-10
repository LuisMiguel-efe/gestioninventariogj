import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SessionUser {
  cedula: string;      // ID en la BD (cédula)
  username: string;    // nombre para mostrar
  nombre: string;
  rol: string;         // empleado | administrador
  departamento?: string;
  cargo?: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;          // username (legacy)
  sessionUser: SessionUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales válidas con usuario vinculado a la BD
// En producción estos vendrían de la base de datos
const ADMIN_ACCOUNTS: Record<string, { password: string; sessionUser: SessionUser }> = {
  'adminGJ': {
    password: 'adminGJ?2026',
    sessionUser: {
      cedula: '94152348',
      username: 'adminGJ',
      nombre: 'Gustavo Adolfo Franco',
      rol: 'administrador',
      cargo: 'Jefe de Compras',
      email: 'compras@administracionesgj.com',
    },
  },
};

const AUTH_TOKEN_KEY = 'auth_token_gj';
const AUTH_USER_KEY = 'auth_user_gj';
const AUTH_SESSION_KEY = 'auth_session_gj';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    const storedSession = localStorage.getItem(AUTH_SESSION_KEY);

    if (token && storedUser && storedSession) {
      try {
        const account = ADMIN_ACCOUNTS[storedUser];
        const isValid = account && token === btoa(`${storedUser}:${account.password}`);
        if (isValid) {
          setIsAuthenticated(true);
          setUser(storedUser);
          setSessionUser(JSON.parse(storedSession));
        } else {
          clearStorage();
        }
      } catch {
        clearStorage();
      }
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const account = ADMIN_ACCOUNTS[username];
    if (account && account.password === password) {
      const token = btoa(`${username}:${password}`);
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, username);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(account.sessionUser));
      setIsAuthenticated(true);
      setUser(username);
      setSessionUser(account.sessionUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearStorage();
    setIsAuthenticated(false);
    setUser(null);
    setSessionUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, sessionUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};
