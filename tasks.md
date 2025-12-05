# Project Rocket Fi - Consolidated Development Tasks

## 🚨 CRITICAL BUILD ERRORS
- [ ] Fix the following build errors:
    ```text

up to date, audited 313 packages in 558ms

54 packages are looking for funding
  run `npm fund` for details

2 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

> rocket-fi@0.1.0 build
> tsc && vite build

src/App.tsx(18,3): error TS6133: 'LayoutDashboard' is declared but its value is never read.
    ```


## Phase 1: Project Setup & Core Architecture

- [x] **Initialize Project**: Setup React with Vite and Tailwind CSS.
- [x] **Data Persistence Layer**:
  - [x] Implement a LocalStorage service wrapper.
  - [x] Ensure NO database connections; all data stays in the browser.
- [x] **Security & Encryption**:
  - [x] Implement AES encryption for all data stored in LocalStorage.
  - [x] Create a mechanism to require an encryption key/password on "Login" to decrypt local data.
  - [x] Ensure the encryption key is never stored; if lost, data is irretrievable.

## Phase 2: Landing Page & Static Content

- [x] **Modern Landing Page**:
  - [x] Implement "How It Works" section.
  - [x] Add "System in Action" section displaying 4 screenshots (`/public` directory) in alphabetical order.
  - [x] Make screenshots clickable: Open modal with 90% screen width, gray background navigation buttons, and close on Esc/outside click.
  - [x] Add disclaimer: "Financial advisors cost $3k-$5k; this tool offers insights for a fraction of that cost but does not replace professional advice."
  - [x] Remove "Track Your Progress" section; replace "Run Simulations" text with "Gain New Insights and Define Your Strategy using AI".
- [x] **Header Navigation**:
  - [x] Show "Login" / "Sign Up Free" only for anonymous users.
  - [x] Show Red "Logout" button only for authenticated users.
- [x] **Privacy Policy**:
  - [x] Update text to emphasize: No database, local encrypted storage, anonymous metrics only, minimal PII collection.
- [x] **FAQ Page**:
  - [x] Add section on Monetization (currently free, potential future subscription, no data selling).
  - [x] Add Mermaid.js diagrams illustrating: Browser Client <-> Local Storage (Encrypted) and Rocket Fi <-> OpenRouter AI (Anonymized).
  - [x] Replace all "TBD" placeholders with actual content.

## Phase 3: User Profile & Data Management

- [x] **Profile Data Fields**:
  - [x] **Remove**: First Name, Last Name, Email, Phone, Address, Employer, Job Title (Minimize PII).
  - [x] **Add/Retain**: Date of Birth (used to calculate "Current Age" automatically throughout app), Marital Status, Employment Status.
  - [x] **Add**: "State" dropdown (US States + "Other").
  - [x] **Username**: Editable, but enforce uniqueness against existing local profiles.
  - [x] **Dependents**: Show "No dependents" message if list is empty.
- [x] **Data Portability**:
  - [x] Implement **Export Data**: JSON format. Offer choice between "Encrypted" (using current key) or "Clear Text" (with security warning).
  - [x] Implement **Import Data**: Parse JSON to replace current profile. Support decryption of imported files.

## Phase 4: Financial Data Modules (CRUD)

_General UI Requirements for all lists below: Sort items by highest value first, make "Add New" sections collapsible, align "Back to Dashboard" button to the TOP of the page, add Filters for list items, use pastel icons for Edit/Delete._

- [ ] **Income Sources**:
  - [ ] Add field: "Income Category" (Pre-Retirement, Post-Retirement, Both).
  - [ ] Add sub-labels: "Use generic names like Salary, Spouse Bonus".
- [ ] **Expenses**:
  - [ ] Rename "Expense Category" to "Retirement Category".
  - [ ] Sort by Highest Value.
- [ ] **Assets**:
  - [ ] Add field: "Estimated Annual Depreciation %".
  - [ ] Sort by Highest Value.
- [ ] **Liabilities**:
  - [ ] Sort by Highest Value.
- [ ] **Investment Accounts**:
  - [ ] **Risk Profile**: Options restricted to "Low", "Medium", "High".
  - [ ] **Account Types**: Checking, Savings, Investment (tax advantaged), Investment (non-tax advantaged).
  - [ ] **Fields**: Add "Estimated Annual Interest %". Rename "Provider" to "Name".
  - [ ] **Security**: Rename "Account Number" to "Account Number (last 4 digits)" and limit input length.

## Phase 5: Dashboard & Visualization

- [ ] **Dashboard Layout**:
  - [ ] Create collapsible sections for Investments, Assets, Income, etc.
  - [ ] **Headers**: Display Summary in collapsed header (e.g., "Investments (5 accounts, total $234,000)").
  - [ ] **Icons**: Right-aligned Chevron Up/Down for state.
- [ ] **General UI Polish**:
  - [ ] Form Inputs: White background for dropdowns (fix transparency issues).
  - [ ] Scroll Behavior: Scroll to top of form when "Edit" is clicked.
  - [ ] Number Formatting: Display dollars with commas/dots, round to nearest integer (hide cents) for readability.

## Phase 6: Calculation Engine (Retirement Goals & Simulations)

- [ ] **Logic Implementation**:
  - [ ] **Current Age**: Always derive from DOB; do not ask user to input age.
  - [ ] **Pre-Retirement Net Worth**:
    - [ ] Logic: Current Net Worth + (Monthly Surplus _ 12) + (Investments _ Compound Interest) - (Assets \* Depreciation).
  - [ ] **Post-Retirement Net Worth**:
    - [ ] Logic: (Investments _ Compound Interest) - (Added Lifestyle Expenses) - (Assets _ Depreciation).
    - [ ] _Crucial_: Exclude "Salary" income types during this phase.
  - [ ] **Bucket Strategy**: Implement logic to highlight 3-Bucket method (Cash / Low Risk / Growth) in projections.
  - [ ] **Inflation**: Add global "Expected Yearly Inflation" input (Default 3%) and apply to all future value calculations.
- [ ] **Simulations Dashboard**:
  - [ ] **Pre-fill**: Button to "Reset/Load" parameters from real user data (Investments, Assets, etc.).
  - [ ] **Risk Metrics**: Implement Sharpe Ratio, Sortino Ratio, Max Drawdown calculations.
- [ ] **Visuals**:
  - [ ] Use Pastel Color palette for all charts (avoid black/dark default themes).
  - [ ] Ensure graphs show "Investments Only" line separate from "Total Net Worth".

## Phase 7: Reports & AI Agent Integration

- [ ] **LLM Integration**:
  - [ ] API: Connect to OpenRouter.ai.
  - [ ] Model Selection: Dropdown filtered by "free" models (Default: `google/gemma-3-27b-it:free`).
  - [ ] Token Stats: Show estimated token usage/cost at bottom of report.
- [ ] **Prompt Engineering**:
  - [ ] **Context Injection**: Include Dependencies (and their ages), User State, Date, "3-Bucket" definition, and disclaimer.
  - [ ] **Review Feature**: Add "Review AI Prompt Before Sending" toggle button to show raw prompt text.
- [ ] **Report UI**:
  - [ ] **Persistence**: Save last generated report and timestamp to LocalStorage.
  - [ ] **Formatting**: Left-align text (fix centering issues), use proper headers/markdown rendering.
  - [ ] **Insights**: Limit Pre/Post retirement insight tables to Top 5 items (collapsible "Show More").
  - [ ] **Loading State**: "Crunching the numbers..." with spinner.
