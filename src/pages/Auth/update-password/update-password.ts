import { verifyEmail } from "$lib/services/auth.service";
import type { verifyPostbody } from "$lib/utils/dto";
import { notifications } from "$lib/utils/notifications";
export const isSuccessfulResponse = writable(false);

import { navigate } from "svelte-navigator";
import { writable } from "svelte/store";

export const handleVerifyEmail = async (
  verifyCodeCredential: verifyPostbody,
) => {
  const response = await verifyEmail(verifyCodeCredential);

  if (response.isSuccessful) {
    notifications.success("Email Verified Successfully");
    navigate("/reset/password");
  } else {
    isSuccessfulResponse.set(true);
    notifications.error("Something went wrong");
    throw "error login user: " + response.message;
  }
};