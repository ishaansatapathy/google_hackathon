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

## 3) सबसे ज़रूरी: Vite env vars (**build time**)

Vite **`VITE_*`** values को **build** के समय कोड में डाल देता है। इसलिए Cloud पर **`npm run build`** चलने से पहले ये variables **build environment** में होने चाहिए।

UI में ढूंढो:

- **Cloud Run** → service → **Edit & deploy new revision** →  
  **Variables & secrets** में अक्सर अलग tabs होते हैं: **Build-time** vs **Runtime**।  
- जहाँ **Build** / **Build environment variables** लिखा हो, वहाँ ये add करो (अपनी असली values से):

| Variable | Notes |
|----------|--------|
| `VITE_GOOGLE_MAPS_API_KEY` | Maps JS API enabled key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard से publishable key |
| `VITE_ANTHROPIC_API_KEY` | अगर Congestion / Claude features चाहिए |
| `VITE_WS_URL` | Production WebSocket URL (अगर तुमने अलग server deploy किया हो; नहीं तो default localhost जैसा production में काम नहीं करेगा) |

**Runtime** में सिर्फ `VITE_*` set करने से **पुराना built JS change नहीं होगा** — नई revision के लिए **dobara build** चाहिए।

Local पर keys **`targo-hero/.env.local`** में रखो; यह file git में नहीं जानी चाहिए।

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
- [ ] `VITE_*` keys **build** env में
- [ ] Deploy के बाद URL खोलकर Maps / Clerk test करो

---

## Troubleshooting

- **`invalid app path 'targo-hero': lstat targo-hero: no such file or directory`:** GitHub repo के root पर `targo-hero` folder **नहीं** है — trigger में **Build context directory खाली** करो और Save करके दोबारा build चलाओ।
- **Blank map / “API key” errors:** build time पर `VITE_GOOGLE_MAPS_API_KEY` missing था — env set करके **rebuild + redeploy**।
- **404 on refresh:** SPA है; `serve -s` already **history fallback** देता है।
- **Port:** Cloud Run `PORT` set करता है; `npm start` उसी को use करता है।
