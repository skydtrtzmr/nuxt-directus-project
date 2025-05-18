import axios from "axios";

const {
    public: {
        directus: { url },
    },
} = useRuntimeConfig();

// 创建 Axios 实例
const axiosClient = axios.create({
    baseURL: url || "/api", // 从环境变量读取基础URL，或提供一个默认值
    timeout: 10000, // 请求超时时间，单位毫秒
    headers: {
        "Content-Type": "application/json",
        // 你可以在这里添加其他通用的请求头
        // 'Authorization': `Bearer ${YOUR_API_TOKEN}`
    },
});

// 你可以根据需要添加请求拦截器
axiosClient.interceptors.request.use(
    (config) => {
        // 在发送请求之前做些什么，例如添加token
        // const token = getToken(); // 假设你有一个获取token的函数
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        // 对请求错误做些什么
        return Promise.reject(error);
    }
);

// 你可以根据需要添加响应拦截器
axiosClient.interceptors.response.use(
    (response) => {
        // 对响应数据做点什么
        return response;
    },
    (error) => {
        // 对响应错误做点什么
        // 例如，如果错误是401 Unauthorized，可以重定向到登录页面
        // if (error.response && error.response.status === 401) {
        //   // redirectToLogin();
        // }
        return Promise.reject(error);
    }
);

export default axiosClient;
