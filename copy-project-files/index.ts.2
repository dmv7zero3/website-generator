// src/lib/api/index.ts
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { ApiService } from "../api";

const API_BASE_URL =
  "https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosRetry(apiClient as any, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

export * from "./prompts";
export { ApiService };
