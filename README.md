# AMP CSR Portal

A customer service portal for AMP car wash memberships. A CSR can find a customer, check their account, vehicles, and billing, and fix the common problems that come up on a support call.

**Live demo:** https://amp-csr.onrender.com
No login needed. All customers are generated demo data.

![Customer detail page for an overdue account](docs/screenshot.png)

## What it does

| Requirement                         | Where                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| View a list of users                | Customer list: paginated table with name, email, phone, plates, and status                                                                     |
| Find and view a user's details      | One search box for name, email, phone, or plate. The detail page shows account info, vehicles with memberships, purchase history, and activity |
| Edit account info                   | **Edit** on the Account card: name, email, phone                                                                                               |
| View and edit vehicle subscriptions | Vehicles card: add a vehicle (optionally with a plan), remove it, or transfer its membership to another car                                    |

### Beyond the brief

- **Status tabs with counts** (All, Overdue, Active, No membership), with overdue accounts flagged in red
- **Search, tab, and page live in the URL**, so refresh, the back button, and shared links keep the CSR's place, and "Back to customers" returns to the same results
- **Overdue banner** on the detail page showing which car, how much, when, and why the charge failed
- **Activity log**: every change is recorded automatically with what it was before and after
- **Guarded actions**: a vehicle with a live membership can't be removed until it's cancelled or transferred, and the menu says why instead of just greying it out
- **Charge warning**: adding a vehicle with a plan says "Charges $29.99 today" before the CSR confirms
- **Transfer options**: move a membership to an existing car or a new one, and optionally remove the old car in the same step (the "I sold my car" call)
- **Retry payment**: an overdue membership can be retried from the vehicle's ⋮ menu, with a confirm that shows the amount before charging
- **CSR notes**: CSRs can leave notes on the account for whoever takes the next call, shown in the activity log alongside automatic changes
- Validation on both the client (instant feedback) and the server (the source of truth), with server errors shown in the dialog without losing what was typed

## Try it

The seed includes one customer for each common support call:

| Customer     | Situation                            | Try                                                                                    |
| ------------ | ------------------------------------ | -------------------------------------------------------------------------------------- |
| Jordan Miles | Overdue: latest charge declined      | Retry his payment from the ⋮ menu and watch the banner clear. Or add a second car and transfer his membership to it; the overdue status moves with it |
| Priya Shah   | Two cars, both on active memberships | Try to remove a car (blocked, with the reason). Transfer one membership to a new car   |
| Marcus Bell  | Cancelled membership                 | Remove his car (allowed, since the membership is cancelled)                            |
| Elena Ruiz   | No membership, single washes only    | Add a car with a plan and watch the charge appear in purchase history                  |

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
```

In development, Vite proxies `/api` to the Express server. For a production build: `npm run build`, then `NODE_ENV=production npm start`.

## Project structure

```
client/src/
  api/          fetch wrapper (ApiError) and one function per endpoint
  pages/        CustomerListPage, CustomerDetailPage
  components/   shared pieces (FormDialog, StatusChip, PlateBadge)
    customer/   account card and edit dialog, purchases, activity and notes, overdue banner
    vehicle/    vehicle rows and the add, remove, transfer, and retry-payment dialogs
  hooks/        useDebounce, useVehicleForm
  utils/        formatting and form validation
server/
  models/       Customer (vehicles and subscriptions embedded), Purchase, Activity
  routes/       URL to controller mapping only
  controllers/  request handling and business rules
  utils/        shared helpers (HttpError, findCustomer, plans, ...)
  seeds/        reproducible demo data (Faker with a fixed seed)
```

Full API reference: [server/README.md](server/README.md)

## Key decisions

- **Vehicles and subscriptions are embedded in the customer.** They're few per customer and always shown together, so one query loads the whole page. Purchases and activity are separate collections because they grow without limit. Each purchase keeps a snapshot of the plate, so receipts stay accurate after a transfer or removal.
- **Customer status is derived, not stored by hand.** A save hook recalculates it from the subscriptions (overdue beats active beats inactive), so it can't drift out of sync.
- **Money is in cents, and the price is locked onto the subscription** at signup, so a future plan price change doesn't affect existing members.
- **Transfers keep the membership exactly as it is**, including an overdue status, so a customer can't escape a failed payment by switching cars.
- **The URL is the single source of truth for the list.** Search, status, and page are read from the URL, and the search box writes to it after a 300ms pause.
- **After a save, the detail page refetches quietly.** A write can also add activity entries or purchases, so reloading everything is simpler and safer than patching pieces of local state. The current data stays on screen meanwhile, so there's no spinner flash.
- **One shared dialog shell (`FormDialog`)** handles the error alert, saving spinner, and blocking close mid-save, so each dialog only defines its fields and what happens on submit.
- **One deployed service.** Express serves the built React app with a fallback to `index.html` for client-side routes, so there's one URL, no CORS setup, and the client calls a relative `/api`.
- **Optimistic concurrency on customers.** Every save checks the document's version, so two simultaneous requests (two CSRs, two tabs, a network retry) can't both apply. The second gets a 409 and is asked to refresh. Since the customer is saved before any charge is recorded, this also prevents a double charge on "retry payment".

## Known limitations and next steps

- **Automated tests.** There are none yet. I'd start with the server's business rules (transfer, the remove guard, derived status) using Vitest and an in-memory MongoDB, then a few end-to-end flows with Playwright.
- **Plan changes in the UI.** The API already supports starting, changing, and cancelling memberships (see [server/README.md](server/README.md)); the UI doesn't expose them yet.
- **Authentication.** There's no login, and every change is logged as "CSR". In production the author would come from the signed-in user, with roles for who can cancel or refund.
- **Transactions.** Optimistic concurrency stops conflicting writes to a customer, but a write still saves the customer, then the purchase and activity record separately. A crash in between could leave them out of sync; a MongoDB transaction would make them all-or-nothing.
- **Payments are simulated.** The seed creates failed charges, but no real card is charged. A real version would use a payment provider and a card-update flow.
- **Search at scale.** Regex search is fine for a demo but doesn't scale; Atlas Search would.
- **Shared types.** Plan definitions and API types are mirrored between the client and server. At scale both would import them from a shared package.
- **A plate can be on two accounts.** Cars get sold, so this is allowed, but two live memberships on one car across accounts could be abused and would deserve a check.
