import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = API_BASE;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [restaurant, setRestaurant] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => {
          setRestaurant(res.data.restaurant);
          if (res.data.restaurant.currency) {
            localStorage.setItem('currency', res.data.restaurant.currency);
          }
        })
        .catch(() => { localStorage.removeItem('token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setToken(res.data.token);
    setRestaurant(res.data.restaurant);
    if (res.data.restaurant.currency) {
      localStorage.setItem('currency', res.data.restaurant.currency);
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post('/api/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setToken(res.data.token);
    setRestaurant(res.data.restaurant);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setRestaurant(null);
  };

  const updateCurrency = (currency) => {
    setRestaurant(prev => prev ? { ...prev, currency } : prev);
  };

  return (
    <AuthContext.Provider value={{ restaurant, token, loading, login, register, logout, updateCurrency }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
