# Project Rocket Fi - Consolidated Development Tasks

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

- [x] **Income Sources**:
  - [x] Add field: "Income Category" (Pre-Retirement, Post-Retirement, Both).
  - [x] Add sub-labels: "Use generic names like Salary, Spouse Bonus".
- [x] **Expenses**:
  - [x] Rename "Expense Category" to "Retirement Category".
  - [x] Sort by Highest Value.
- [x] **Assets**:
  - [x] Add field: "Estimated Annual Depreciation %".
  - [x] Sort by Highest Value.
- [x] **Liabilities**:
  - [x] Sort by Highest Value.
- [x] **Investment Accounts**:
  - [x] **Risk Profile**: Options restricted to "Low", "Medium", "High".
  - [x] **Account Types**: Checking, Savings, Investment (tax advantaged), Investment (non-tax advantaged).
  - [x] **Fields**: Add "Estimated Annual Interest %". Rename "Provider" to "Name".
  - [x] **Security**: Rename "Account Number" to "Account Number (last 4 digits)" and limit input length.

## Phase 5: Dashboard & Visualization

- [x] **Dashboard Layout**:
  - [x] Create collapsible sections for Investments, Assets, Income, etc.
  - [x] **Headers**: Display Summary in collapsed header (e.g., "Investments (5 accounts, total $234,000)").
  - [x] **Icons**: Right-aligned Chevron Up/Down for state.
- [x] **General UI Polish**:
  - [x] Form Inputs: White background for dropdowns (fix transparency issues).
  - [x] Scroll Behavior: Scroll to top of form when "Edit" is clicked.
  - [x] Number Formatting: Display dollars with commas/dots, round to nearest integer (hide cents) for readability.

## Phase 6: Calculation Engine (Retirement Goals & Simulations)

- [x] **Logic Implementation**:
  - [x] **Current Age**: Always derive from DOB; do not ask user to input age.
  - [x] **Pre-Retirement Net Worth**:
    - [x] Logic: Current Net Worth + (Monthly Surplus _ 12) + (Investments _ Compound Interest) - (Assets \* Depreciation).
  - [x] **Post-Retirement Net Worth**:
    - [x] Logic: (Investments _ Compound Interest) - (Added Lifestyle Expenses) - (Assets _ Depreciation).
    - [x] _Crucial_: Exclude "Salary" income types during this phase.
  - [x] **Bucket Strategy**: Implement logic to highlight 3-Bucket method (Cash / Low Risk / Growth) in projections.
  - [x] **Inflation**: Add global "Expected Yearly Inflation" input (Default 3%) and apply to all future value calculations.
- [x] **Simulations Dashboard**:
  - [x] **Pre-fill**: Button to "Reset/Load" parameters from real user data (Investments, Assets, etc.).
  - [x] **Risk Metrics**: Implement Sharpe Ratio, Sortino Ratio, Max Drawdown calculations.
- [x] **Visuals**:
  - [x] Use Pastel Color palette for all charts (avoid black/dark default themes).
  - [x] Ensure graphs show "Investments Only" line separate from "Total Net Worth".

## Phase 7: Reports & AI Agent Integration

- [x] **LLM Integration**:
  - [x] API: Connect to OpenRouter.ai.
  - [x] Model Selection: Dropdown filtered by "free" models (Default: `google/gemma-3-27b-it:free`).
  - [x] Token Stats: Show estimated token usage/cost at bottom of report.
- [x] **Prompt Engineering**:
  - [x] **Context Injection**: Include Dependencies (and their ages), User State, Date, "3-Bucket" definition, and disclaimer.
  - [x] **Review Feature**: Add "Review AI Prompt Before Sending" toggle button to show raw prompt text.
- [x] **Report UI**:
  - [x] **Persistence**: Save last generated report and timestamp to LocalStorage.
  - [x] **Formatting**: Left-align text (fix centering issues), use proper headers/markdown rendering.
  - [x] **Insights**: Limit Pre/Post retirement insight tables to Top 5 items (collapsible "Show More").
  - [x] **Loading State**: "Crunching the numbers..." with spinner.
  - [ ] **Model Selection Enhancements**:
    - [ ] **Expand Model List**: Query the OpenRouter API to list _all_ available free models dynamically, rather than a hardcoded selection.
  - [ ] **User Guidance**: Add tooltip/help text suggesting users try different models to obtain diverse financial perspectives or "second opinions."
- [ ] **Report History & UI**:
  - [ ] **History Logic**: Persist generated reports in LocalStorage. Display the most recent report at the top (expanded) and previous reports at the bottom (collapsed/accordion style).
  - [ ] **Privacy Clarity**: Expand the Privacy Note to explicitly mention: "You can expand the AI Prompt section below to see exactly what data is being shared with the model before generation."
- [ ] **Advanced AI Features**:
  - [ ] **Beneficiaries Checklist**: Create a specific prompt/action to generate a "Beneficiary Audit" list (checking titles, deeds, and account designations).
  - [ ] **Open-Ended Chat**: Add a generic "Ask the Planner" interface allowing users to ask free-form questions based on their currently loaded financial context.
  - [ ] **Prompt Configuration**: Externalize the base System Prompts into the `.env` file (or a dedicated config object) to allow easier tweaking of the AI persona without altering application code.

## Phase 8: Fixing functional issues

- [x] the labels in the Y axis in graphs in screens Goals and Simulations are getting cropped. Let's add a larger horizontal margin to avoid it. Make the margin dynamically larger based on the number of digits we present in the Y axis of the graph.
- [x] the user's birth date is critical for all our reports. lets request user to setup the user profile before he can access the Goals, Simulations and Reports pages.
- [x] in Liabilities screen, I see "Add New Liabilitie". This is incorrect, it should show "Add New Liability".
- [x] add tips to help the user enter most accurate information. for example, in Investment screen "Risk Profile" field we can say "Use Low for Checking, Savings, CDs etc; Medium for S&P 500 ETF and mutual funds; High for riskier leveraged investment instruments like TQQQ"
- [x] to help user enter comprehensive financial profile, lets include clickable examples for each category like Investments, Income, Expenses etc. for example, in Investments screen, when user clicks "Add New Investment Account", we can show top 5 most common options user still did not enter, including "Checking", "Savings", "Brokerage", "401K", "IRA" etc. same thing for the other categories. for example, in Expenses we can include "Car Insurance", "Health Insurance", "Groceries", "Utilities" etc.
- [x] lets include a selection for each category so user can classify each item as "Pre-Retirement", "Post-Retirement" or "Pre and Pos-Retirement".
- [x] lets include a free form field "Details" for each category so user can include special remarks for each item.
- [x] lets include a monthly contribution field in Investments items. User can indicate how much per month in average he contributes to each investment, like monthly IRA or 401K contributions (total, including company match etc).
- [ ] lets add an asterisk in "Monthly Contribution", noting that contributions only apply until pre-retirement date. adjust calculations accordingly.
- [x] in Financial Dashboard screen, lets reorder categories as: Income Sources, Investments, Assets, Expenses and Liabilities.
- [x] Liability form should have required fields for Name and Balance, and optional fields for everything else. this will allow user to enter future liabilities like "Child's Wedding" etc.
- [x] in Financial Dashboard screen, add a Financial Snapshot section with cards for: Total Assets, Total Liabilities, Net Worth. add a Monthly Cash Flow section with cards for: Total Monthly Income, Total Monthly Expenses, Monthly Surplus/Deficit.
- [x] in Simulations screen, add verbiage and insights to help user understand the simulation results
- [x] in Simulations screen, allow user to change the life expectancy and take it into account in our simulations. it seems to be hardcoded to 90 years. also allow user to set inflation rate and "Annual Retirement Spending (Today's Dollars)".
- [ ] **State Management**: Implement global state persistence (or Context preservation) to ensure field values are not lost when navigating between screens without saving.
- [ ] **Visual Enhancements**:
  - [ ] **Contextual Stats**: Add small, collapsible statistical charts to every CRUD screen (e.g., an asset allocation pie chart on the Assets screen).
- [ ] **User Education**:
  - [ ] **Definitions**: Add a clearly visible tooltip or info box distinguishing "Expenses" (recurring/lifestyle costs) vs. "Liabilities" (debts/loans with balances).
- [ ] **Bug Fixes**:
  - [ ] **PDF Export**: Fix layout engine to prevent page breaks from cutting off text or graphs in the generated PDF report. If this is not possible, lets remove the page breaks to avoid duplicated and cropped content between pages.

### Create **Phase 9: Mobile Adaptation & Deployment**

- [ ] **Progressive Web App (PWA)**:
  - [ ] **Manifest**: Create `manifest.json` for installability.
  - [ ] **Service Worker**: Implement basic caching for offline capability.
  - [ ] **iOS Optimization**: Ensure meta tags and touch icons are configured for "Add to Home Screen" on iOS.
- [ ] **Mobile Layout**: Audit all charts and tables for responsiveness on small screens.
