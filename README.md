# AMP CSR Portal

A customer service portal for AMP car wash memberships. A CSR can find a customer, check their account, vehicles, and billing, and fix the common problems that come up on a support call.

**Live demo:** https://amp-csr.onrender.com
No login needed. All customers are generated demo data.

![Customer detail page for an overdue account](docs/screenshot.png)

## What it does

| Requirement                         | Where                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| View a list of users                | Customer list: paginated table with name, email, phone, plates, and status                                                                                                                                                                       |
| Find and view a user's details      | One search box for name, email, phone, or plate. The detail page shows account info, vehicles with memberships, purchase history, and activity                                                                                                   |
| Edit account info                   | **Edit** on the Account card: name, email, phone. The card on file is updated by the customer through a **card update link**, so a CSR never handles card numbers. A car's details (plate, year, make, model, color) are corrected from its menu |
| View and edit vehicle subscriptions | Each vehicle's menu: **start** a membership, **change plan**, **transfer** it to another car, or **cancel** it. Vehicles are added and removed there too                                                                                         |

### The four support calls

- **"I want to cancel my account."** Cancel account on the Account card ends every membership in one step, with a reason. For one car, use Cancel membership in that car's actions menu.
- **"I have a question about a recent purchase."** Purchase history shows the date, description, plate, amount, status, and why a charge failed. A paid charge can be refunded from its row, with a reason.
- **"I purchased a new vehicle and I want my subscription transferred."** Transfer membership in the car's actions menu, to a new vehicle, optionally removing the old car in the same step.
- **"I am not able to get a wash."** The overdue banner says which car, how much, when, and why, and Retry payment is in the car's actions menu. If the card on file has expired, the banner and the menu say so, Retry is blocked, and **Send card update link** on the Account card is the next step. If the plate on file is wrong, Edit vehicle details fixes it.

### Beyond the brief

- **Status tabs with counts** (All, Overdue, Active, No membership), with overdue accounts flagged in red
- **Search, tab, and page live in the URL**, so refresh, the back button, and shared links keep the CSR's place, and "Back to customers" returns to the same results
- **Overdue banner** on the detail page showing which car, how much, when, and why the charge failed
- **Activity log**: every change is recorded automatically with what it was before and after
- **Every vehicle action in one place**: the menu groups actions into Membership, Payment, and Vehicle. Unavailable actions stay visible with the reason (for example "Cancel or transfer the membership first"), and keyboard and screen reader users can reach those reasons too
- **Plan cards**: starting a membership or changing plans shows the plans side by side with what each includes, so the CSR can explain the difference. The button says what happens to the money: "Start and charge $29.99", or no charge today for a plan change
- **Transfer options**: move a membership to an existing car or a new one, and optionally remove the old car in the same step (the "I sold my car" call)
- **Retry payment** for an overdue membership, with a confirm that shows the amount before charging
- **Card on file** on the Account card (brand, last 4, expiry, red when expired) and a **Send card update link** action with a confirm that shows the email address. Only display details are stored, never the card number
- **Member since** on the Account card, so the CSR sees how long the customer has been with AMP
- **Refunds** from purchase history: the full amount, with a reason, and the membership is left alone. Two simultaneous refunds of the same charge can't both go through
- **Cancel account** for customers with several cars: one step that ends every membership in a single save, warns about unpaid charges, and keeps the account and history so the customer can rejoin
- **CSR notes** on the account for whoever takes the next call, shown in the activity log alongside automatic changes
- **Two CSRs, one customer**: account edits, vehicle edits, and plan changes carry the version the CSR loaded, so a save made from an out-of-date page is rejected instead of overwriting a newer change. The dialog says so and the page quietly reloads the latest data
- Validation on both the client (instant feedback) and the server (the source of truth), with server errors shown in the dialog without losing what was typed
- **Unit tests** for the billing, card expiry, status, search, and error rules (`npm test`)

## Try it

The seed includes one customer for each common support call:

| Customer     | Situation                            | Try                                                                                                                                                 |
| ------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jordan Miles | Overdue: latest charge declined      | Retry his payment from the menu and watch the banner clear. Or add a second car and transfer his membership to it; the overdue status moves with it |
| Priya Shah   | Two cars, both on active memberships | Try to remove a car (blocked, with the reason). Transfer one membership to a new car. Or **Cancel account** to end both in one step                 |
| Marcus Bell  | Cancelled membership                 | Start a new membership on his car, or remove it (allowed, since the membership is cancelled)                                                        |
| Elena Ruiz   | No membership, single washes only    | Add a car, then start a membership from its menu and watch the charge appear in purchase history                                                    |
| Sam Carter   | Overdue: card on file expired        | Retry payment is blocked with the reason. Send a card update link from the Account card and see it in the activity log                              |

Searching `404 555` finds all four by phone. Searching a plate like `ovr-1234` works too.

## Tech stack

- **Client:** React 19, TypeScript, Vite, MUI, React Router
- **Server:** Node, Express 5, TypeScript, Mongoose
- **Database:** MongoDB Atlas
- **Hosting:** Render, with one service serving both the API and the built client

## Run locally

Requires Node 22.12 or later and a MongoDB connection string (Atlas or local).

```bash
npm run install-all
cp server/.env.example server/.env   # then set MONGODB_URI
npm run seed                         # loads demo data (replaces existing data)
npm run dev                          # client on http://localhost:5173, API on :3001
npm test                             # server unit tests
```

In development, Vite proxies `/api` to the Express server. For a production build: `npm run build`, then `NODE_ENV=production npm start`. If your network can't resolve the Atlas address (seen on some Windows setups), set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `server/.env`.

## Project structure

```
client/src/
├── api/              fetch wrapper and one function per endpoint
├── pages/            customer list and customer detail
├── components/       shared: FormDialog, ReasonField, StatusChip, PlateBadge
│   ├── customer/     account card, activity, overdue banner
│   ├── purchase/     purchase history and refunds
│   └── vehicle/      vehicle rows, actions menu, plan cards, action dialogs
├── hooks/            useDebounce, useVehicleForm
└── utils/            formatting, card expiry, and form validation

server/
├── models/           Customer (vehicles embedded), Purchase, Activity
├── routes/           URL → controller mapping
├── controllers/      request handling
├── middleware/       errorHandler
├── utils/            business rules: status, billing dates, card expiry, cancellation, search
├── tests/            Vitest + Supertest unit tests
└── seeds/            reproducible demo data

```

Full API reference: [server/README.md](server/README.md)

## Key decisions

- **Vehicles and subscriptions are embedded in the customer.** They're few per customer and always shown together, so one query loads the whole page. Purchases and activity are separate collections because they grow without limit. Each purchase keeps a snapshot of the plate, so receipts stay accurate after a transfer or removal.
- **Customer status is derived, not stored by hand.** A plain function (`deriveCustomerStatus`) runs on every save and recalculates it from the subscriptions (overdue beats active beats inactive), so it can't drift out of sync, and the rule is unit tested.
- **Money is in cents, and the price is locked onto the subscription** at signup, so a future plan price change doesn't affect existing members.
- **Transfers keep the membership exactly as it is**, including an overdue status, so a customer can't escape a failed payment by switching cars.
- **The URL is the single source of truth for the list.** Search, status, and page are read from the URL, and the search box writes to it after a 300ms pause.
- **After a save, the detail page refetches quietly.** A write can also add activity entries or purchases, so reloading everything is simpler and safer than patching pieces of local state. The current data stays on screen meanwhile, so there's no spinner flash.
- **One shared dialog shell (`FormDialog`)** handles the error alert, saving spinner, and blocking close mid-save, so each dialog only defines its fields and what happens on submit.
- **One deployed service.** Express serves the built React app with a fallback to `index.html` for client-side routes, so there's one URL, no CORS setup, and the client calls a relative `/api`.
- **Two layers of conflict protection.** Every save checks the customer's version (Mongoose optimistic concurrency), so two requests racing on the server can't both apply; this is what stops a double click on "retry payment" from charging twice. That alone doesn't catch a CSR acting on a page loaded minutes earlier, so edits that no business rule guards (account details, vehicle details, plan changes) also send the version the CSR loaded, and the server returns 409 if it has moved on. Other actions are already guarded by their rules ("has no active membership", "already has a membership"). Refunds use a third technique: purchases are separate documents, so a refund is a single conditional update that only applies while the purchase is still paid.
- **Adding a car and starting a membership are separate steps**, so the flow is the same whether the car is new or has been on the account for years.
- **Cancelling an account ends memberships; it doesn't delete anything.** Every membership is cancelled in one save, so it can't half-succeed, and the account, vehicles, purchases, and activity stay for the next call or a rejoin.
- **Cards are updated by the customer, not the CSR.** The portal stores only what a payment processor returns for display (brand, last 4, expiry). The CSR sends a link and the customer enters the card themselves, which keeps card numbers off support calls and out of PCI scope. Retry is blocked on an expired card, since the charge would only fail again.

## Next steps

- **Real payments.** Charges and the card update link are simulated. With a provider such as Stripe, the link would open its hosted card page, a webhook would save the new card, and the overdue payment would retry automatically. Charges would use an idempotency key, and the membership, purchase, and activity writes would share a MongoDB transaction.
- **Wash visit log.** Each visit's time, location, and gate result, so on an "I couldn't get a wash" call the CSR can see exactly what happened at the site.
- **Sign-in and roles.** Changes are logged as "CSR" today. The author would come from the signed-in user, with roles for who can cancel or refund.
- **More tests.** API tests against an in-memory MongoDB for transfer, retry, and refunds, then a few end-to-end flows with Playwright.
- **Search at scale.** Atlas Search in place of regex search once the customer count grows.
