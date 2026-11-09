# Family Finance

Angular frontend for the Family Finance monthly budgeting assignment.

## Prerequisites

- Node.js and npm compatible with the versions in `package.json`.
- The ASP.NET Core API running with its development launch profile.

## Configure and run

The development environment uses `https://localhost:54535` as the API base URL (`src/environments/environment.ts`). The backend launch profile also exposes `http://localhost:54536`.

The backend CORS policy must allow the Angular origin `http://localhost:4200`. The development policy allows both `http://localhost:4200` and the existing `http://localhost:4400` origin.

From the repository root, start the API:

```powershell
dotnet run --project backend\FamilyFinance.Api --launch-profile FamilyFinance.Api
```

In another terminal:

```powershell
Set-Location frontend
npm ci
npm start
```

Open `http://localhost:4200/`. The root route redirects to monthly planning. API requests show an explicit connection error and retry action when the backend is unavailable.

## Demonstration flow

1. Create a monthly plan with positive whole-VND income.
2. View backend-calculated jar allocations and select another month from the allocation page.
3. Add an expense; its date selects the monthly plan and its jar options.
4. Open Spending by Jar from the allocation page or after saving an expense.

Money is sent as digit-only strings, except backend `remainingVnd`, which may be negative. The frontend displays server-calculated financial values and does not calculate allocations or spending totals.

## Tests and build

```powershell
npm test
npm run build
```

The Angular unit-test target enables coverage and enforces 80% statement, branch, function, and line coverage.
