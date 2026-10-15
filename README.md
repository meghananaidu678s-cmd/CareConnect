# CareConnect

CareConnect is a healthcare appointment prototype with a React/Vite frontend and an Express API. The API persists accounts, appointments, payments, messages, and notifications in MongoDB.

## Run locally

Install dependencies with `npm install`, start a local MongoDB server (or create a MongoDB Atlas cluster), then configure the API connection and start the API:

```powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017"
$env:MONGODB_DB = "careconnect"
npm run dev:api
```

In a second terminal, start the web app:

```sh
npm run dev
```

For MongoDB Atlas, set `MONGODB_URI` to the connection string from your Atlas deployment instead. `MONGODB_DB` is optional and defaults to `careconnect`. `MONGODB_URI` is required; the API exits with an error if it is missing or MongoDB cannot be reached. The Vite development server proxies `/api` requests to `http://localhost:3001`. The API listens on port `3001` by default; set `API_PORT` to use another port and update the Vite proxy if needed.

The current prototype stores its mutable application state in one MongoDB document in the `application_state` collection. On first startup, if that document does not yet exist, the API imports the existing `data/careconnect.json` file when present and leaves the source file untouched. This preserves existing local data, but the single-document design is subject to MongoDB's 16 MiB document limit and is intended for the prototype rather than high-volume production use.

Use the demo account:

- Email: `demo@careconnect.app`
- Password: `demo1234`

To run a production build, set a strong `JWT_SECRET` and `MONGODB_URI` (and optionally `MONGODB_DB`), run `npm run build`, then `npm start`. The production server serves the built frontend and API from the same port.

## Prototype limitations

Prices are shown in Indian rupees (INR), with consultation fees from ₹499 and a ₹49 platform fee. Payments are simulated. Use the test card `4242 4242 4242 4242`, any future expiry date, and any 3-digit CVV. Only the card brand and last four digits are retained; full card numbers and security codes are never stored. Appointment verification codes are returned by the API in development only.

Sample health-record data is for local development only. This prototype is not intended to store real patient or payment information. Before deployment, use an access-controlled MongoDB deployment, migrate the single-document state store to appropriately scoped collections, configure production secrets and HTTPS, and connect verified payment and email/SMS providers.
