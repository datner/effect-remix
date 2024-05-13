import { HttpServer } from "@effect/platform";

export const redirect = (
  url: string,
) =>
  HttpServer.response.empty({
    status: 302,
    headers: HttpServer.headers.fromInput({
      Location: url,
    }),
  });

export const redirectDocument = (url: string) =>
  HttpServer.response.setHeader(
    redirect(url),
    "X-Remix-Reload-Document",
    "true",
  );
