# ZCoder Setup Guide

This README will guide you through setting up the **ZCoder** full-stack application locally. It covers installation, environment setup, and database seeding.

---

## 🔧 Project Structure

```
zcoder/
├── backend/
└── frontend/
```

---

## 🚀 Getting Started

### 1. Clone the repository:

```bash
git clone https://github.com/nwesha/Zcoder-project.git
cd Zcoder-project
```

### 2. Install dependencies

#### Frontend

```bash
cd frontend
npm install react
npm install @tanstack/react-query
npm install
```

#### Backend

```bash
cd ../backend
npm install
```

---

## 🔑 Environment Variables

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

### Backend (`backend/.env`)

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zcoder
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
CLIENT_URL=http://localhost:3000
JUDGE0_API_KEY=ae8d8b5577mshab5147292f2e9a0p120674jsnf749e7d5e79f
```

---

## 🧠 Running the Project

### Frontend

```bash
cd frontend
npm run dev
```

Runs the Next.js app on: [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend
npm run dev
```

Runs the Express/MongoDB API server on: [http://localhost:5000](http://localhost:5000)

---

## 🌱 Seeding the Database with Problems

### Step 1: Create a User

To seed problems, you must have **one user already created in the database**. You can do this by registering a user via the frontend (localhost:3000).

### Step 2: Get the User ID

After registering, copy the user's `_id` from the database (e.g., via MongoDB Compass or Mongo shell).

### Step 3: Update the Seed File

Navigate to `backend/seed/seedProblems.js` and **replace  dummyAuthorId** with your actual user ID.


### Step 4: Run the Seeder

From the `backend/` directory:

```bash
node seed:problems
```

This will populate the database with the problem set.

---

## 🐛 Troubleshooting

* Make sure MongoDB is running locally.
* Ensure your environment variables are correctly set.

---

## 🚧 Features Under Development

Please note that ZCoder is an evolving project and certain features are still in progress. 

---

## 📬 Contributions

Feel free to fork, submit issues, or pull requests to improve the project!

---

## 📄 License

MIT License
