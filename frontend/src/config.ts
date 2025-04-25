// 获取当前主机IP地址
const getHostIP = () => {
    // 如果是开发环境，使用当前主机IP
    if (process.env.NODE_ENV === 'development') {
        // 获取当前主机IP地址
        const hostname = window.location.hostname;
        // 如果是localhost，尝试获取本机IP
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // 这里可以设置一个默认的IP地址，或者让用户手动输入
            return '192.168.1.106'; // 请替换为您的实际IP地址
        }
        return hostname;
    }
    // 如果是生产环境，使用当前主机IP
    return window.location.hostname;
};

// API配置
export const API_CONFIG = {
    BASE_URL: `http://${getHostIP()}:8000`,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
        },
        USERS: {
            LIST: '/api/users',
            CREATE: '/api/users',
            BULK_CREATE: '/api/users/bulk',
        },
        CONVERSATIONS: {
            LIST: '/api/conversations',
            CREATE: '/api/conversations',
            DETAIL: (id: number) => `/api/conversations/${id}`,
        },
        CHAT: {
            SEND: '/api/chat/send',
        },
    },
}; 