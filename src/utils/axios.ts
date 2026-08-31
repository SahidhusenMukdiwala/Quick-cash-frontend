import axios from 'axios';

// baseURL matches the Express backend API
const axiosServices = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/'
});

// ==============================|| AXIOS INTERCEPTORS ||============================== //

axiosServices.interceptors.request.use(
  (config) => {
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
      const userIP = localStorage.getItem('userIP');
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

// Fetch public IP address once and cache it in localStorage
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      if (data && data.ip) {
        localStorage.setItem('userIP', data.ip);
      }
    } catch (err) {
      // Silent error - will fallback to backend req.ip if this fails
    }
  })();
}

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
