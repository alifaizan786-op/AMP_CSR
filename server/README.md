# AMP CSR Portal API

REST API for the AMP Customer Service Representative portal. Built with Express 5, TypeScript, Mongoose, and MongoDB Atlas.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your values
npm run seed           # loads demo data (wipes existing data)
npm run dev            # starts the API on http://localhost:3001
```

### Environment variables

| Variable      | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `MONGODB_URI` | MongoDB connection string, including the database name (`/amp_csr`) |
| `PORT`        | Port for the API. Defaults to `3001`                                |
| `DNS_SERVERS` | Optional. Comma-separated DNS servers for networks that can't resolve the Atlas address (e.g. `8.8.8.8,1.1.1.1`). Leave unset in production |

### Scripts

| Script              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Runs the API with `tsx watch`, restarting on file changes |
| `npm run build`     | Compiles TypeScript to `dist/`                            |
| `npm start`         | Runs the compiled build                                   |
| `npm run seed`      | Clears all collections and loads demo data                |
| `npm run typecheck` | Type-checks without emitting files                        |
| `npm test`          | Runs the unit tests (Vitest)                              |

## Data model

| Collection   | Contains                                               | Notes                                                                                                                      |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `customers`  | Account info, with vehicles and subscriptions embedded | Vehicles are few per customer and always shown together, so they're embedded. Each vehicle holds at most one subscription. |
| `purchases`  | Membership charges and single washes                   | Separate collection, since history grows without limit. Stores a snapshot of the plate at purchase time.                   |
| `activities` | CSR notes and automatic change records                 | Append-only log per customer                                                                                               |

- **Customer status** (`active`, `overdue`, `inactive`) is derived from the customer's subscriptions on every save, so it can't drift out of sync. Overdue takes priority.
- **Money is stored in cents** (`2999` = $29.99) to avoid floating-point rounding errors.
- **Phone numbers are stored as digits only**, so searches match regardless of formatting.

## Demo customers

The seed includes one customer for each common support call:

| Customer     | Scenario                                 |
| ------------ | ---------------------------------------- |
| Jordan Miles | Overdue: latest membership charge failed |
| Priya Shah   | Two vehicles with active memberships     |
| Marcus Bell  | Cancelled membership                     |
| Elena Ruiz   | No membership, single washes only        |

## Endpoints

All endpoints are prefixed with `/api`. Errors return a JSON body with a `message`:

```json
{ "message": "Customer not found" }
```

| Status | Meaning                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `400`  | Invalid input, such as a malformed id, an unknown status, a failed validation, or a body that isn't JSON |
| `404`  | Resource not found                                                                                        |
| `409`  | A business rule blocks the change (such as a duplicate plate), or another request changed the customer at the same moment |
| `413`  | Request body over 100 KB                                                                                  |
| `500`  | Unexpected server error                                                                                   |                               |

### Health check

`GET /api/health`

```json
{ "status": "ok" }
```

### List and search customers

`GET /api/customers`

| Query param | Type   | Default | Description                                                                                                                                                     |
| ----------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search`    | string |         | Matches first name, last name, email, license plate, or phone. With several words, every word must match the first or last name, in any order (so "Mary Ann Smith" works). Phone matching applies only when the search looks like a phone number (digits plus spaces, dashes, parentheses, `+`, or dots, with at least 3 digits); a leading US `+1` is ignored. Case-insensitive. |
| `status`    | string |         | Filter by `active`, `overdue`, or `inactive`                                                                                                                    |
| `page`      | number | `1`     | Page number                                                                                                                                                     |
| `limit`     | number | `20`    | Results per page (max `100`)                                                                                                                                    |

Example: `GET /api/customers?search=404555&status=overdue&page=1`

```json
{
	"customers": [
		{
			"_id": "6702f1...",
			"firstName": "Jordan",
			"lastName": "Miles",
			"email": "jordan.miles@example.com",
			"phone": "4045550101",
			"status": "overdue",
			"vehicles": [
				{
					"_id": "6702f1...",
					"plate": "OVR1234",
					"make": "Toyota",
					"model": "Camry"
				}
			]
		}
	],
	"page": 1,
	"limit": 20,
	"total": 1,
	"totalPages": 1,
	"statusCounts": { "active": 2, "overdue": 1, "inactive": 1 }
}
```

`statusCounts` reflects the current search but ignores the `status` filter, so the UI can show a count on every filter tab.

### Get customer details

`GET /api/customers/:id`

Returns the full customer with vehicles and subscriptions, their purchase history, and their activity log, both newest first.

```json
{
	"customer": {
		"_id": "6702f1...",
		"firstName": "Jordan",
		"lastName": "Miles",
		"email": "jordan.miles@example.com",
		"phone": "4045550101",
		"status": "overdue",
		"vehicles": [
			{
				"_id": "6702f1...",
				"plate": "OVR1234",
				"make": "Toyota",
				"model": "Camry",
				"year": 2021,
				"color": "Silver",
				"subscription": {
					"plan": "deluxe",
					"price": 2999,
					"status": "overdue",
					"startDate": "2026-05-14T01:43:20.041Z",
					"nextBillingDate": "2026-10-14T01:43:20.041Z"
				}
			}
		],
		"createdAt": "2026-10-14T01:43:20.041Z",
		"updatedAt": "2026-10-14T01:43:20.041Z"
	},
	"purchases": [
		{
			"_id": "6702f1...",
			"type": "membership",
			"description": "Deluxe monthly membership",
			"amount": 2999,
			"status": "failed",
			"failureReason": "Card expired",
			"vehiclePlate": "OVR1234",
			"createdAt": "2026-10-14T01:43:20.041Z"
		}
	],
	"activities": [
		{
			"_id": "6702f1...",
			"type": "note",
			"message": "Called in: says the wash gate will not open",
			"author": "CSR",
			"createdAt": "2026-10-14T01:43:20.041Z"
		}
	]
}
```

### Update account info

`PATCH /api/customers/:id`

Send any of `firstName`, `lastName`, `email`, `phone`. Other fields are ignored; vehicles and subscriptions have their own endpoints. Each real change is recorded in the activity log.

```json
{ "email": "jordan.m@example.com", "phone": "(470) 555-1212" }
```

Returns the updated customer.

| Error | When                                                        |
| ----- | ----------------------------------------------------------- |
| `400` | Invalid id, a field isn't text, or a value fails validation |
| `404` | Customer not found                                          |
| `409` | Email already belongs to another customer                   |

### Add a note

`POST /api/customers/:id/notes`

```json
{ "message": "Customer asked about a refund for the October charge" }
```

Returns `201` with the new activity entry. Notes are trimmed and limited to 1,000 characters.

### Cancel an account

`POST /api/customers/:id/cancel`

```json
{ "reason": "Moving out of state" }
```

Cancels every active and overdue membership on the account in one save, with the same rules as cancelling a single membership: a reason is required (max 200 characters), cancellation is immediate, and billing stops. The account, vehicles, and history stay, so the customer can rejoin later. Failed charges stay in purchase history. Returns `409` if there are no active or overdue memberships.

## Vehicles and memberships

All routes below are under `/api/customers/:id/vehicles`. Every successful request returns the **full updated customer**, so the UI can replace its copy in one step. Every change is recorded in the activity log.

Plates are stored uppercase without spaces or dashes (`abc-123` becomes `ABC123`) and must be 2 to 8 letters or numbers.

**Billing is simulated.** Starting a membership or retrying a payment records a successful `membership` purchase; no real payment is processed.

### Add a vehicle

`POST /api/customers/:id/vehicles`

```json
{
	"plate": "ABC123",
	"make": "Kia",
	"model": "Soul",
	"year": 2023,
	"color": "Red",
	"plan": "basic"
}
```

Only `plate` is required. Include `plan` (`basic`, `deluxe`, or `ultimate`) to start a membership right away. Returns `201`.

| Error | When                                                    |
| ----- | ------------------------------------------------------- |
| `400` | Missing or invalid plate, invalid year, or unknown plan |
| `409` | That plate is already on this account                   |

### Remove a vehicle

`DELETE /api/customers/:id/vehicles/:vehicleId`

| Error | When                                                                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------- |
| `409` | The vehicle has an active or overdue membership. Cancel or transfer it first, so a membership is never dropped by accident. |

### Start a membership

`POST /api/customers/:id/vehicles/:vehicleId/subscription`

```json
{ "plan": "deluxe" }
```

Charges the first month and sets the next billing date one month out. Returns `201`. Returns `409` if the vehicle already has an active or overdue membership.

### Change plan

`PATCH /api/customers/:id/vehicles/:vehicleId/subscription`

```json
{ "plan": "ultimate" }
```

The new price applies from the next billing date (no proration). Returns `409` if the membership is cancelled or overdue; an overdue payment must be resolved first.

### Cancel a membership

`POST /api/customers/:id/vehicles/:vehicleId/subscription/cancel`

```json
{ "reason": "Moving out of state" }
```

A reason is required (max 200 characters). Cancels immediately and stops billing. Returns `409` if there's no active or overdue membership.

### Transfer a membership

`POST /api/customers/:id/vehicles/:vehicleId/subscription/transfer`

Moves the membership from `:vehicleId` to another vehicle, keeping the same plan, price, start date, and billing status. Send **one** of:

```json
{ "toVehicleId": "6702f1...", "removeOldVehicle": false }
```

```json
{
	"vehicle": {
		"plate": "NEW123",
		"make": "Tesla",
		"model": "Model Y",
		"year": 2026
	},
	"removeOldVehicle": true
}
```

Use `vehicle` for the common case of a customer who bought a new car: it adds the car and moves the membership in one request. Set `removeOldVehicle` to `true` to remove the old car at the same time.

| Error | When                                                                                     |
| ----- | ---------------------------------------------------------------------------------------- |
| `400` | Both or neither of `toVehicleId` and `vehicle` sent, or transferring to the same vehicle |
| `409` | The source has no active membership, or the target already has one                       |

### Retry a failed payment

`POST /api/customers/:id/vehicles/:vehicleId/subscription/retry-payment`

For overdue memberships. Records a successful charge, sets the membership back to active, and moves the next billing date one month out. The failed charge stays in purchase history. Returns `409` if the membership isn't overdue.

| Error                     | When                                 |
| ------------------------- | ------------------------------------ |
| `400 Invalid customer id` | `:id` isn't a valid MongoDB ObjectId |
| `404 Customer not found`  | No customer with that id             |