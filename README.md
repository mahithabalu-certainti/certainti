# **rdcredits\_platform\_fe**

A React-based ThinkRD365 application with Azure AD authentication, built using TypeScript, Vite, Tailwind CSS, and integrated Material UI components.

---

## **Getting Started**

### **Prerequisites**

* **Node.js** (recommend v16+)

---

### **Local Setup**

1. **Clone the Repository**

   ```bash
   git clone https://github.com/certainti-ai/rdcredits_platform_fe.git
   cd rdcredits_platform_fe
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create environment files in the root directory (e.g., `.env.development`, `.env.qa`, `.env.preprod`, `.env.prod`) and add the required variables.

---

## **Running the Application**

Depending on the environment, you can start the application with:

| **Environment** | **Command**             |
| --------------- | ----------------------- |
| Development     | `npm run start:development`     |
| QA              | `npm run start:qa`      |
| Pre-Production  | `npm run start:preprod` |
| Production      | `npm run start:prod`    |

Example:

```bash
npm run start:prod
```

The app will be available at: [http://localhost:3000](http://localhost:3000)

---

## **Building the Application**

Build optimized production-ready assets for a specific environment:

| **Environment** | **Command**             |
| --------------- | ----------------------- |
| Development     | `npm run build:development`     |
| QA              | `npm run build:qa`      |
| Pre-Production  | `npm run build:preprod` |
| Production      | `npm run build:prod`    |

Example:

```bash
npm run build:prod
```

---

## **Code Quality Commands**

* **Linting:**

  ```bash
  npm run lint        # Check for linting errors
  npm run lint:fix    # Auto-fix linting issues
  ```

* **Formatting:**

  ```bash
  npm run format:check  # Check code formatting
  npm run format        # Auto-fix formatting issues
  ```

---

## **Technology Stack**

### **Core Libraries**

* **React** – Frontend library for building user interfaces
* **TypeScript** – Static type-checking for JavaScript
* **Vite** – Lightning-fast build tool

### **UI Framework & Styling**

* **@mui/material** – Material Design components
* **Tailwind CSS** – Utility-first CSS framework (if included)

### **State Management & Routing**

* **Redux Toolkit** & **React Redux** – Predictable state management
* **React Router** – Declarative routing for React apps

### **Development Tools**

* **ESLint** – Code linting for consistency and best practices
* **Prettier** – Code formatting
* **TypeScript ESLint** – Linting TypeScript code

---

## **Project Structure**

```
rdcredits_platform_fe
|
├── src/
│   ├── admin                  # Admin module
│   │   ├── mockdata           # Mock data for admin
│   │   ├── pages              # Admin pages
│   │   ├── service            # API services for admin
│   │   └── types              # Types and interfaces
│   ├── api                    # Generic API utilities
│   ├── assets                 # Static assets
│   │   ├── icons              # SVG icons
│   │   └── images             # Images and logos
│   ├── common-service         # Shared services
│   ├── common-utils           # Shared utilities
│   ├── components             # Reusable UI components
│   ├── config                 # App configuration
│   ├── constants              # Static constants
│   ├── consultant             # Consultant module
│   │   ├── mockdata           # Mock data for consultant
│   │   ├── pages              # Consultant pages
│   │   ├── services           # API services for consultant
│   │   └── types              # Types and interfaces
│   ├── hooks                  # Custom React hooks
│   ├── locales                # Localization files
│   ├── pages                  # Global pages
│   ├── routes                 # Routing configuration
│   ├── store                  # Redux store configuration
│   ├── utils                  # Utility helpers
│   ├── App.tsx                # Root component
│   └── main.tsx               # App entry point
|
├── .env.development           # Environment variables for development
├── .env.qa                    # Environment variables for QA
├── .env.preprod               # Environment variables for pre-production
├── .env.prod                  # Environment variables for production

```

---

## **Environment Setup**

The application uses **Vite's environment mode system**:

| **Mode**       | **Environment File** |
| -------------- | -------------------- |
| Development    | `.env.development`           |
| QA             | `.env.qa`            |
| Pre-Production | `.env.preprod`       |
| Production     | `.env.prod`          |

Make sure to configure the necessary variables (e.g., API URLs, Azure credentials) in the relevant `.env.*` file before starting or building the app.

