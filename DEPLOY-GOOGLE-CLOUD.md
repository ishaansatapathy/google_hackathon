# Google Cloud Run — Targo Hero (step‑by‑step)

यह ऐप **Vite + React** है: **`npm run build`** से `dist/` बनता है, **`npm start`** उसी को सर्व करता है (Cloud Run का `PORT` और `0.0.0.0` use होता है).

---

## 1) पहले तैयारी (local)

1. [Google Cloud Console](https://console.cloud.google.com/) खोलो → नया प्रोजेक्ट बनाओ या चुनो।
2. **Billing** लगाना पड़ेगा (free tier limits के अंदर भी)।
3. APIs चालू करो: **Cloud Run**, **Cloud Build**, **Artifact Registry** (UI deploy करते समय अक्सर auto-enable हो जाता है)।

---

## 2) GitHub से deploy (Cloud Run “Source” / continuous deploy)

**सबसे ज़रूरी:** **Build context directory** = वह folder जहाँ GitHub repo में **`package.json`** दिखता है — local PC पर folder का नाम ज़रूरी नहीं।

| तुम्हारा repo कैसा है | **Build context directory** में क्या भरो |
|------------------------|------------------------------------------|
| **`google_hackathon` जैसा repo** — root पर ही `package.json` है (GitHub पर `targo-hero` नाम का folder **नहीं** है) | **खाली छोड़ो** या **`.`** या **`/`** — **`targo-hero` मत लिखो** |
| Monorepo — root में कई apps, और `package.json` किसी subfolder में है (जैसे `apps/web/`) | वही subfolder path, जैसे `apps/web` |

| Field / जगह | क्या भरना है |
|-------------|----------------|
| **Repository** | अपना GitHub repo (जैसे `ishaansatapathy/google_hackathon`) |
| **Branch** | `main` (या जो तुम use करते हो) |
| **Build context directory** | ऊपर वाली table देखो — **इस project के लिए खाली** |
| **Entry point** | **खाली छोड़ो** — Node ऐप के लिए default `npm start` चलेगा |
| **Function target** | **खाली छोड़ो** — यह Cloud Functions के लिए होता है, साधारण web app नहीं |

**Build command** अक्सर auto: `npm install` + `npm run build` (जब `build` script हो)।  
**Start command**: `npm start` → हमारा script `dist/` serve करता है।

---

## 3) API keys — Maps (आसान तरीका) + बाकी Vite keys

### Google Maps (Cloud Run — **rebuild की ज़रूरत नहीं**)

**Cloud Run** → service → **Edit & deploy new revision** → **Variables & secrets** → **Add variable**:

| Name | Value |
|------|--------|
| `GOOGLE_MAPS_API_KEY` | वही key जो Google Cloud Console → Credentials में है (Maps JavaScript API on) |

यह key runtime पर `/runtime-env.js` से browser को मिलती है। Deploy / revision save के बाद map चलना चाहिए।

**Referrer restriction:** API key में **Website restrictions** में अपनी Cloud Run URL add करो, जैसे  
`https://google-hackathon01-1030690806777.europe-west1.run.app/*`  
या `https://*.run.app/*` (कम strict)।

### Clerk / Anthropic / WS — अभी भी **build time** (`VITE_*`)

ये अभी भी Vite bundle में build के समय जाते हैं — **Cloud Build** के **build environment variables** में set करो, फिर redeploy:

| Variable | Notes |
|----------|--------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `VITE_ANTHROPIC_API_KEY` | Jaam / Claude features |
| `VITE_WS_URL` | Production WebSocket URL |

Local पर keys **`.env.local`** में रखो; commit मत करो।

---

## 4) CLI से एक बार (optional)

Cloud SDK install करके, repo में `targo-hero` पर:

```bash
# repo clone के बाद जहाँ package.json है वहीं से:
gcloud run deploy SERVICE_NAME --source . --region REGION
```

Build args के लिए `cloudbuild.yaml` या Console में build env set करना पड़ सकता है।

---

## 5) Checklist

- [ ] Build context = **repo में जहाँ `package.json` है** (`google_hackathon` के लिए अक्सर **खाली**)
- [ ] Entry point = **empty**
- [ ] Function target = **empty**
- [ ] Maps: Cloud Run में **`GOOGLE_MAPS_API_KEY`** (runtime) + API key referrer में **`.run.app`** URL
- [ ] Clerk / Anthropic / WS: **`VITE_*`** **build** env में (जहाँ Cloud Build चलता है)
- [ ] Deploy के बाद URL खोलकर Maps / Clerk test करो

---

## Troubleshooting

- **`invalid app path 'targo-hero': lstat targo-hero: no such file or directory`:** GitHub repo के root पर `targo-hero` folder **नहीं** है — trigger में **Build context directory खाली** करो और Save करके दोबारा build चलाओ।
- **Blank map / “API key” errors:** Cloud Run में **`GOOGLE_MAPS_API_KEY`** add करो; Maps JavaScript API on हो; key की **HTTP referrer** में site URL allow हो।
- **404 on refresh:** SPA है; server **rewrites** से `index.html` fallback देता है।
- **Port:** Cloud Run `PORT` set करता है; `npm start` उसी को use करता है।
