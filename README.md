# Family Finance Management

Family Finance Management is a small internal family finance application.

## Project Structure

- `frontend/` - Angular 21 standalone frontend
- `backend/` - ASP.NET Core backend (planned)
- `docs/` - Product requirements, design, development specifications, and test artifacts

## Prerequisites

- .NET 8 SDK for the backend.
- Node.js 22+ and npm 10+ for the frontend.

## Backend

From the repository root, start the API:

```powershell
dotnet run --project backend\FamilyFinance.Api\FamilyFinance.Api.csproj --launch-profile FamilyFinance.Api
```

The API listens at `https://localhost:54535`; Swagger is at
`https://localhost:54535/swagger`. The launch profile also exposes
`http://localhost:54536`, which redirects to HTTPS. The API applies pending database
migrations when it starts.

### Trust the HTTPS development certificate

The frontend calls the API over HTTPS. Trust the ASP.NET Core development
certificate once for the current Windows user:

```powershell
dotnet dev-certs https --trust
dotnet dev-certs https --check --trust
```

Accept the Windows certificate prompt. This is the recommended option and does
not require administrator permission. For a one-off local test, **Proceed to
localhost (unsafe)** can also bypass the browser warning, but it skips certificate
validation and does not trust the certificate for other clients. Refresh the browser
after either option.

## Frontend

The frontend uses Angular `21.2.24`, TypeScript `5.9`, and npm. API base URL is
`https://localhost:54535` in `frontend\src\environments\environment.ts`.

In a second terminal:

```powershell
Set-Location frontend
npm ci
npm start
```

Open `http://localhost:4200/` after the development server starts. Keep the API
terminal running.

### Build

```powershell
Set-Location frontend
npm run build
```

Build output is written to `frontend/dist/family-finance/`.

## Demonstration

1. Create a monthly plan with positive whole-VND income.
2. View the seven backend-calculated jar allocations.
3. Add an expense with a date, jar, amount, and description.
4. Open Spending by Jar and confirm the updated totals.

## Developed Scope

The implemented assignment scope covers:

- **F1 — Monthly planning:** create a monthly plan with positive VND income and
  seven predefined jars.
- **F2 — Income allocation:** view backend-calculated budgets and allocation
  rates for all seven jars.
- **F3 — Add expense:** save a positive VND expense with a date and description
  to a jar in an existing monthly plan.
- **F4 — Spending by Jar:** view each jar's spent amount, planned budget, and
  usage percentage.

Not included in this scope: the F5 full dashboard, editing or deleting expenses,
and customizing jars or allocation rates.

## Development Rules

This project follows spec-driven development. Before implementing business features,
read the relevant product brief, requirements, design, and development specification
under `docs/`. Financial calculations remain authoritative in the backend and use VND.
