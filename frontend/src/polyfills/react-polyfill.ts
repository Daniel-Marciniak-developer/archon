import React from "react";

type ReactWithUse = typeof React & { use: (promise: any) => any };


if (!("use" in React)) {
  (React as ReactWithUse).use = function use(promise) {
    if (
      typeof promise === "object" &&
      promise !== null &&
      typeof promise.then === "function"
    ) {

      let status = promise.status;
      if (status === undefined) {

        let suspender = promise;
        suspender.status = "pending";
        suspender.then(
          (result) => {
            if (suspender.status === "pending") {
              suspender.status = "fulfilled";
              suspender.value = result;
            }
          },
          (error) => {
            if (suspender.status === "pending") {
              suspender.status = "rejected";
              suspender.reason = error;
            }
          },
        );
        throw suspender;
      } else if (status === "fulfilled") {
        return promise.value;
      } else if (status === "rejected") {
        throw promise.reason;
      } else {
        throw promise;
      }
    } else if (
      typeof promise === "object" &&
      promise !== null &&
      typeof promise._context !== "undefined"
    ) {

      return React.useContext(promise._context || promise);
    } else if (
      typeof promise === "object" &&
      promise !== null &&
      typeof promise.$$typeof !== "undefined"
    ) {

      return React.useContext(promise);
    } else {

      return React.useContext(promise);
    }
  };
}

export default React;

