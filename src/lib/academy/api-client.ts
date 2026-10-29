// Browser-side fetch wrapper. Every API answer is JSON; an error answer always
// carries `error` (human text) and sometimes `code` (machine-readable), the
// way the library's routes do.
export class ApiError extends Error {
  status: number;
  code: string | undefined;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(typeof data.error === "string" ? data.error : `HTTP ${status}`);
    this.status = status;
    this.code = typeof data.code === "string" ? data.code : (data.error as string | undefined);
    this.data = data;
  }
}

export async function api<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, { error: "Sem conexão" });
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}
