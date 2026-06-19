import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("legal_user");
    const token = localStorage.getItem("legal_token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("legal_user", JSON.stringify(userData));
    localStorage.setItem("legal_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("legal_user");
    localStorage.removeItem("legal_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
