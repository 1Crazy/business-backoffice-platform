import type { FormInstance } from "element-plus";

export function getRequestErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;

  if (Array.isArray(message) && message.length) {
    return message[0];
  }

  if (typeof message === "string") {
    return message;
  }

  return fallback;
}

export async function validateForm(form: FormInstance | undefined): Promise<boolean> {
  if (!form) {
    return true;
  }

  try {
    await form.validate();
    return true;
  } catch {
    return false;
  }
}
