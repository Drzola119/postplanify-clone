export async function studioApi<T>(
  url: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok || result.ok === false)
    throw Error(
      result.message ||
        result.error?.message ||
        `Request failed (${response.status})`,
    );
  return result as T;
}
