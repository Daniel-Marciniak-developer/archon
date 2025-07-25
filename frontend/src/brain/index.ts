import { auth } from "app/auth";
import { API_HOST, API_PATH, API_PREFIX_PATH, API_URL } from "../constants";
import { Brain } from "./Brain";
import type { RequestParams } from "./http-client";

const isLocalhost = /localhost:\d{4}/i.test(window.location.origin);

const constructBaseUrl = (): string => {
  if (isLocalhost) {
    return `${API_URL}${API_PATH}`;
  }

  if (API_HOST && API_PREFIX_PATH) {
    return `https://${API_HOST}${API_PREFIX_PATH}`;
  }

  return `${API_URL}${API_PATH}`;
};

type BaseApiParams = Omit<RequestParams, "signal" | "baseUrl" | "cancelToken">;

const constructBaseApiParams = (): BaseApiParams => {
  return {
    credentials: "include",
    secure: true,
  };
};

const constructClient = () => {
  const baseUrl = constructBaseUrl();
  const baseApiParams = constructBaseApiParams();

  return new Brain({
    baseUrl,
    baseApiParams,
    customFetch: (url, options) => {
      return fetch(url, options);
    },
    securityWorker: async () => {
      return {
        headers: {
          Authorization: await auth.getAuthHeaderValue(),
        },
      };
    },
  });
};

const brain = constructClient();

export default brain;

