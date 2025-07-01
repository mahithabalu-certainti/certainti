# rdcredits_platform_be

## 🧠 Think RD 365 Backend

This is the backend service for Think RD 365, built using Node.js, Express.js, and TypeScript. It provides core functionality for account management, project management, and user services.

## 🔧 Features

* ✅ User management 
* ✅ Account management
* ✅ Project management
* ✅ REST API support
* ✅ Middleware for security, logging, and validation
* ✅ Error handling and consistent response formatting
* ✅ Modular codebase for scalability and maintainability

## 📁 Project Structure
```
rdcredits_platform_be
│
├── account-module/            # Handles account-related operations
├── entity-module/             # Handles entities used across modules
├── user-module/
│   └── src/
│       ├── config/            # Configuration files
│       ├── controllers/       # Route controllers (REST)
│       ├── graphql/           # GraphQL schema definitions
│       ├── lib/               # Reusable libraries/utilities
│       ├── middlewares/       # Middleware functions
│       ├── models/            # Database models (TypeORM or Sequelize)
│       ├── resolvers/         # GraphQL resolvers
│       ├── routes/            # Express route definitions
│       ├── servers/           # Server setup files
│       ├── services/          # Business logic
│       ├── utils/             # Utility functions (e.g. for emails, tokens)
│       └── index.ts           # Main entry point of the user module
│
├── Dockerfile                 # Docker configuration
├── jest.config.js             # Jest testing configuration
├── package.json               # Project metadata and dependencies
├── package-lock.json          # Lock file for npm dependencies
├── tsconfig.json              # TypeScript compiler configuration
├── .env                       # Environment variables
└── README.md                  # Project documentation
```
## 🛠️ Setup & Installation

### Prerequisites

Ensure you have the following installed on your system:

* [Node.js](https://nodejs.org/) (v20.x or higher)
* npm (comes with Node.js)
* [PostgreSQL](https://www.postgresql.org/) (if applicable)

### Clone the Repository

```
git clone https://github.com/certainti-ai/rdcredits_platform_be.git
```
```
cd module-name
```

### Install Dependencies
```
npm install
```

## 🚀 Running the App
### 🧪 Development Mode
```
npm run start / npm start
```
* Starts the server using `nodemon`
* Auto-restarts on file changes