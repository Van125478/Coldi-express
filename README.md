# Coldi-express
(Coldi) - He thong van tai duong xa

## Local development

After Windows starts, MongoDB must be available at `127.0.0.1:27017` before the API.

```bash
cd server
npm run dev
```

```bash
cd web
npm run dev
```

Open `http://127.0.0.1:5173`. The API listens on `http://127.0.0.1:4000`. Use those addresses, not `localhost`: on this machine `localhost` resolves to IPv6 first, and the session cookie is issued for `127.0.0.1`.
