import axios from 'axios';

// baseURL matches the Express backend API
const axiosServices = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/'
});

// Fetch public IP address helper (cached in localStorage)
let ipPromise: Promise<string | null> | null = null;

const getPublicIP = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem('userIP');
  if (cached) return cached;

  if (!ipPromise) {
    ipPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data && data.ip) {
          localStorage.setItem('userIP', data.ip);
          return data.ip;
        }
      } catch (err) {
        // Fallback to backend req.ip if this fails
      }
      return null;
    })();
  }

  return ipPromise;
};

// ==============================|| AXIOS INTERCEPTORS ||============================== //

axiosServices.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || localStorage.getItem('serviceToken');
    const role = localStorage.getItem('role') || sessionStorage.getItem('role');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (role) {
      config.headers['Role'] = role;
    }

    // Attach user's public IP address to x-forwarded-for header
    if (typeof window !== 'undefined') {
      const userIP = await getPublicIP();
      if (userIP) {
        config.headers['x-forwarded-for'] = userIP;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosServices.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403: Account deactivated by administrator
    if (error.response && error.response.status === 403) {
      const errMsg = error.response.data?.message || '';
      if (errMsg.toLowerCase().includes('inactive') || errMsg.toLowerCase().includes('deactivated')) {
        localStorage.clear();
        sessionStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/?reason=deactivated';
        }
        return Promise.reject(error);
      }
    }

    // Handle 401: Unauthorized access or expired session
    const isAuthRequest =
      originalRequest.url?.includes('auth/login') ||
      originalRequest.url?.includes('auth/register') ||
      originalRequest.url?.includes('auth/refresh-token');

    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const refreshToken = typeof window !== 'undefined'
        ? (localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token'))
        : null;

      if (!refreshToken) {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      try {
        // Request new access token from backend
        const response = await axios.post(`${axiosServices.defaults.baseURL}auth/refresh-token`, {
          refresh_token: refreshToken
        });

        const access_token =
          response.data?.result?.data?.access_token ||
          response.data?.data?.access_token ||
          response.data?.access_token;

        if (!access_token) {
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
          }
          return Promise.reject(error);
        }

        localStorage.setItem('access_token', access_token);
        axiosServices.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        return axiosServices(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosServices;
