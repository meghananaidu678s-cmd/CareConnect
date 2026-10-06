# CareConnect

CareConnect is a healthcare appointment prototype with a React/Vite frontend and an Express API. The API persists demo accounts, appointments, payments, messages, and notifications to `data/careconnect.json`.

## Run locally

Install dependencies with `npm install`, then start the API and web app in separate terminals:

```sh
npm run dev:api
npm run dev
```

The Vite development server proxies `/api` requests to `http://localhost:3001`. The API listens on port `3001` by default; set `API_PORT` to use another port and update the Vite proxy if needed.

Use the demo account:

- Email: `demo@careconnect.app`
- Password: `demo1234`

To run a production build, set a strong `JWT_SECRET`, run `npm run build`, then `npm start`. The production server serves the built frontend and API from the same port.

## Prototype limitations

Prices are shown in Indian rupees (INR), with consultation fees from ₹499 and a ₹49 platform fee. Payments are simulated. Use the test card `4242 4242 4242 4242`, any future expiry date, and any 3-digit CVV. Only the card brand and last four digits are retained; full card numbers and security codes are never stored. Appointment verification codes are returned by the API in development only.

The JSON file store and sample health-record data are for local development only. This prototype is not intended to store real patient or payment information. Before deployment, replace the file store with an access-controlled database, configure production secrets and HTTPS, and connect verified payment and email/SMS providers.
