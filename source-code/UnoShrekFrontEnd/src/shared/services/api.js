const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include", // envia cookies httpOnly automaticamente
  };

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  // Respostas sem corpo (204 No Content)
  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    const message = data?.message ?? data?.error ?? "Unexpected error";
    throw new Error(message);
  }

  return data;
}

export const api = {
  get:    (path)         => request("GET",    path),
  post:   (path, body)   => request("POST",   path, body),
  put:    (path, body)   => request("PUT",    path, body),
  delete: (path)         => request("DELETE", path),
};