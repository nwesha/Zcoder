# ZCoder - Collaborative Coding Platform

ZCoder is a full-stack web application designed to help users practice coding problems, track progress, and compete in real-time rooms. Built with a MERN (MongoDB, Express, React/Next.js, Node.js) stack.

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/nwesha/Zcoder-project.git
cd zcoder-project
```

---

## 🚀 Installation

### Frontend Setup

```bash
cd frontend
npm install
```

### Backend Setup

```bash
cd ../backend
npm install
```

---

## 📁 Environment Variables

### Frontend (`frontend/.env.local`)

Create a file named `.env.local` in the `frontend` directory and add the following:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

### Backend (`backend/.env`)

Create a file named `.env` in the `backend` directory and add the following:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zcoder
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
CLIENT_URL=http://localhost:3000
JUDGE0_API_KEY=ae8d8b5577mshab5147292f2e9a0p120674jsnf749e7d5e79f
```

---

## 🗃️ Seeding Problems into the Database

After setting up MongoDB and environment variables:

```bash
cd backend
node seed:problems
```

This will populate the database with coding problems from the JSON file located in `backend/seed/problems.json`.

---

## 🏃 Running the App

### Start Backend Server

```bash
cd backend
npm run dev
```

### Start Frontend App

```bash
cd frontend
npm run dev
```

The application should now be running at `http://localhost:3000`.

---

## 🔗 Useful Links

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:5000](http://localhost:5000)
* WebSocket: `ws://localhost:5000`

---

## 🛠 Technologies Used

* **Frontend:** Next.js, React, Tailwind CSS
* **Backend:** Node.js, Express.js, MongoDB
* **Authentication:** JWT (Access + Refresh tokens)
* **Real-Time:** WebSockets
* **Code Execution:** Judge0 API

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
