import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_USERNAME = 'adminGJ';
const VALID_PASSWORD = 'adminGJ?2026';
const AUTH_TOKEN = 'auth_token_gj';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN);
    const storedUser = localStorage.getItem('auth_user_gj');
    
    if (token && storedUser) {
      // Validar que el token sea válido
      const isValid = verifyToken(token);
      if (isValid) {
        setIsAuthenticated(true);
        setUser(storedUser);
      } else {
        // Token inválido, limpiar
        localStorage.removeItem(AUTH_TOKEN);
        localStorage.removeItem('auth_user_gj');
      }
    }
  }, []);

  const verifyToken = (token: string): boolean => {
    // Validación simple del token (en producción usar JWT o similar)
    return token === btoa(`${VALID_USERNAME}:${VALID_PASSWORD}`);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Simulamos una pequeña demora para que parezca una petición real
      await new Promise(resolve => setTimeout(resolve, 500));

      // Validar credenciales
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        // Generar token
        const token = btoa(`${username}:${password}`);
        
        // Guardar en localStorage
        localStorage.setItem(AUTH_TOKEN, token);
        localStorage.setItem('auth_user_gj', username);
        
        // Actualizar estado
        setIsAuthenticated(true);
        setUser(username);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem(AUTH_TOKEN);
    localStorage.removeItem('auth_user_gj');
    
    // Actualizar estado
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
