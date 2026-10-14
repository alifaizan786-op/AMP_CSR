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

### Scripts

| Script              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Runs the API with `tsx watch`, restarting on file changes |
| `npm run build`     | Compiles TypeScript to `dist/`                            |
| `npm start`         | Runs the compiled build                                   |
| `npm run seed`      | Clears all collections and loads demo data                |
| `npm run typecheck` | Type-checks without emitting files                        |

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

| Status | Meaning                                                 |
| ------ | ------------------------------------------------------- |
| `400`  | Invalid input, such as a malformed id or unknown status |
| `404`  | Resource not found                                      |
| `500`  | Unexpected server error                                 |

### Health check

`GET /api/health`

```json
{ "status": "ok" }
```

### List and search customers

`GET /api/customers`

| Query param | Type   | Default | Description                                                                                                                  |
| ----------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `search`    | string |         | Matches first name, last name, full name, email, phone, or license plate. Case-insensitive; phone matches ignore formatting. |
| `status`    | string |         | Filter by `active`, `overdue`, or `inactive`                                                                                 |
| `page`      | number | `1`     | Page number                                                                                                                  |
| `limit`     | number | `20`    | Results per page (max `100`)                                                                                                 |

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
		"fullName": "Jordan Miles",
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

| Error                     | When                                 |
| ------------------------- | ------------------------------------ |
| `400 Invalid customer id` | `:id` isn't a valid MongoDB ObjectId |
| `404 Customer not found`  | No customer with that id             |
