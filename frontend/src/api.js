import axios from "axios";

const API = axios.create({ baseURL: "https://streamsync-rd2d.onrender.com//api" });

export const registerUser = (userData) => API.post("/auth/register", userData);
export const loginUser = (userData) => API.post("/auth/login", userData);
