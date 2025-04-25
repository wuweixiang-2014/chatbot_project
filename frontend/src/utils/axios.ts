import axios from 'axios';
import { API_CONFIG } from '../config';

const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // 未授权，清除token并跳转到登录页
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    // 权限不足
                    console.error('Permission denied');
                    break;
                case 404:
                    // 资源不存在
                    console.error('Resource not found');
                    break;
                case 500:
                    // 服务器错误
                    console.error('Server error');
                    break;
                default:
                    console.error('Unknown error');
            }
        }
        return Promise.reject(error);
    }
);

export default instance; 