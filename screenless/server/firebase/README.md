# ScreenLess AI proxy, on Firebase

> This folder holds two Firebase codebases. `functions/` is the Gemini proxy described
> here (`screenless-ai`). `leaderboard/` is the friends board server
> (`screenless-social`), with its own README. `firebase deploy --only functions`
> deploys both; name one to deploy only that one, for example
> `--only functions:screenless-ai`.

Holds the Gemini key in Cloud Secret Manager so the app does not have to. The
client just does a plain `fetch` at the function url, so **nothing in the app
changes** beyond one environment variable.

There is an equivalent Cloudflare Worker in `../gemini-proxy` if you would rather
not put this on Blaze. Pick one. The two behave identically.

## Which key is which

This function needs a **Gemini API key**, from [Google AI Studio](https://aistudio.google.com/apikey)
or from the Generative Language API in your Cloud project. It is stored as a
server side secret and the client never sees it.

It is **not** your Firebase web API key. That one ships publicly inside client
apps by design, and Google's guidance is to keep the Gemini Developer API off its
allowlist: any unrestricted key in a project with the Generative Language API
enabled can spend that project's Gemini quota, which has been used as a real
billing attack. Keep the two separate so you can rotate the Gemini key without
touching anything else.

## Deploy

Requires the **Blaze** plan; Cloud Functions cannot deploy on Spark. The free
monthly allowance covers this comfortably.

```bash
cd server/firebase
npm --prefix functions install
npx firebase login
npx firebase use YOUR_PROJECT_ID
npx firebase functions:secrets:set GEMINI_API_KEY
npx firebase deploy --only functions:screenless-ai
```

Also put your project id in `.firebaserc`, replacing the placeholder.

Deploy prints the url:

```
https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/gemini
```

Put it in `.env` for a local build, and in `eas.json` under
`build.production.env.EXPO_PUBLIC_GEMINI_PROXY_URL` for an EAS build:

```
EXPO_PUBLIC_GEMINI_PROXY_URL=https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/gemini
```

Change `region` in `functions/index.js` if `europe-west1` is not where you want it.
The url contains the region, so redeploy and update the variable if you move it.

## Check it works

```bash
curl -s -X POST https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/gemini \
  -H 'content-type: application/json' \
  -d '{"contents":[{"role":"user","parts":[{"text":"say hi in five words"}]}]}'
```

A JSON body with a `candidates` array means it is wired up.

## Optional shared token, off by default

Stops a leaked url being useful on its own. Not authentication: the token ships
inside the app too, so rotating it means shipping a new build. Treat it as a tap
you can turn off.

It is off by default and deliberately not declared as a secret, because Firebase
prompts for the value of any declared secret that does not exist yet, which would
block `firebase deploy` on an interactive question. **Do not answer that prompt
by inventing a value** — the function would then require a header the app does
not send, and every request would come back 401.

To switch it on, in this order:

1. uncomment the `defineSecret('APP_TOKEN')` line in `functions/index.js` and add
   `APP_TOKEN` to the `secrets` array
2. `npx firebase functions:secrets:set APP_TOKEN`
3. send the same value as an `x-app-token` header from `src/ai/gemini.ts`
4. redeploy, then ship the app build that sends the header

## About the `firebase-functions` version warning

Deploy warns that `firebase-functions@6` is outdated; 7.x is current. Pinned to 6
on purpose for now: the CLI's own warning says the upgrade carries breaking
changes, and this function works. Upgrade after the store release, not before it,
and re-run the smoke test above afterwards.

## Cost control

`maxInstances: 10` is the ceiling on a runaway bill if the url is found and
hammered. Requests beyond that queue and then fail rather than scaling up. Raise
it only when real traffic needs it. Replies are capped at 220 tokens with
thinking disabled, so a normal month should sit inside the free allowance.

For proper abuse protection later, add [Firebase App Check](https://firebase.google.com/docs/app-check)
with Play Integrity. It attests that requests come from your genuine app rather
than from a script holding the url. It needs the Firebase client SDK in the app,
which is why it is not wired up here.

## What the function will not do

- forward anything other than `contents`, `systemInstruction` and a narrow
  `generationConfig`
- accept caller supplied safety settings; the child thresholds are fixed in the
  function
- accept a caller supplied response schema
- accept a body over 16 KB or an output over 600 tokens
