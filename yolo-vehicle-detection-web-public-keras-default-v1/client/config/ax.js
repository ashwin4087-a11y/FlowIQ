import axios from "axios";
import conf from "./conf";

export const axData = {
  jwt: null, // เริ่มต้นเป็น null
};

if (typeof window !== "undefined") {
  axData.jwt = sessionStorage.getItem("jwt") || null; // ✅ ดึงค่า JWT เฉพาะบน Client
}

const ax = axios.create({
  baseURL: conf.apiBaseUrl,
});

ax.interceptors.request.use((config) => {
  if (axData.jwt) {
    config.headers.Authorization = `Bearer ${axData.jwt}`; // 🔥 ส่ง JWT ไปกับทุก request
  }
  return config;
});

export default ax;
