# ScreenLess AI proxy, on Cloudflare

Holds the Gemini key so the app does not have to. Free tier on Cloudflare covers
this comfortably; the whole thing is one file, and no billing account is needed.

There is an equivalent Firebase Function in `../firebase` if you already run on
Firebase. Pick one. The two behave identically, and changing one means changing
the other.

## Deploy

```bash
cd server/gemini-proxy
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY   # paste a fresh Google AI Studio key
npx wrangler deploy
```

`deploy` prints a url like `https://screenless-ai.<your-subdomain>.workers.dev`.
Put that url in `eas.json` under `build.production.env.EXPO_PUBLIC_GEMINI_PROXY_URL`,
replacing the `example` placeholder, and rebuild.

## Check it works

```bash
curl -s -X POST https://screenless-ai.<your-subdomain>.workers.dev \
  -H 'content-type: application/json' \
  -d '{"contents":[{"role":"user","parts":[{"text":"say hi in five words"}]}]}'
```

A JSON body with a `candidates` array means it is wired up.

## Optional hardening

**Per address daily cap.** Create a KV namespace and uncomment the binding in
`wrangler.toml`:

```bash
npx wrangler kv namespace create RATE
```

**Shared token.** Stops a leaked url being useful on its own, and can be rotated
without a store release only if you also ship the new token, so treat it as a
tap rather than as authentication:

```bash
npx wrangler secret put APP_TOKEN
```

Then send it from the app by setting `EXPO_PUBLIC_GEMINI_PROXY_TOKEN` and
attaching an `x-app-token` header in `src/ai/gemini.ts`.

## What the worker will not do

- forward anything other than `contents`, `systemInstruction` and a narrow
  `generationConfig`
- accept caller supplied safety settings; the child thresholds are fixed in the
  worker
- accept a caller supplied response schema
- accept a body over 16 KB or an output over 600 tokens

## Key hygiene

Restrict the key in Google AI Studio to the Generative Language API and give it
a low quota. If it ever leaks, `wrangler secret put GEMINI_API_KEY` replaces it
with no app release needed. That is the main reason the key lives here.
