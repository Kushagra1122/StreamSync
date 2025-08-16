import axios from "axios";

const API = axios.create({ baseURL: "https://streamsync-v13p.onrender.com//api" });

export const registerUser = (userData) => API.post("/auth/register", userData);
export const loginUser = (userData) => API.post("/auth/login", userData);
