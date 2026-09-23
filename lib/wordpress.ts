const baseUrl =
  process.env.WORDPRESS_BASE_URL ?? "https://caribbeanstarstorett.com";
const apiPath = process.env.WORDPRESS_API_PATH ?? "/wp-json/wp/v2";

type WordPressFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export async function wordpressFetch<T>(
  resource: string,
  init?: WordPressFetchInit,
): Promise<T> {
  const url = new URL(
    `${apiPath.replace(/\/$/, "")}/${resource.replace(/^\//, "")}`,
    baseUrl,
  );

  const response = await fetch(url, {
    ...init,
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`WordPress request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
