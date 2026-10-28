"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";

import { getEnvVar } from "@/lib/utils";

const backendUrl = getEnvVar("BACKEND_URL");

export const backendClient = axios.create({
  baseURL: backendUrl,
});

export const getAuthenticatedBackendClient = async () => {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Unable to retrieve Clerk session token");
  }

  return axios.create({
    baseURL: backendUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const fetchBackendData = async <T>(
  endpoint: string,
  logMessage = `Failed to fetch backend endpoint: ${endpoint}`,
): Promise<T | null> => {
  try {
    const backendClient = await getAuthenticatedBackendClient();
    const response = await backendClient.get<T>(endpoint);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(logMessage, error.message);
      return null;
    }

    throw error;
  }
};
