# Commotion

A collaborative Web app for real-time, cross-team board editing.

## Screenshots:

> Homepage view:

![Homepage](screenshots/Picture1.png)

> Side-by-side view of 2 users editing the same board:

![Side-by-side](screenshots/Picture2.png)

> Live demo of 3 users editing the same board:

![Floating-cursors-live](screenshots/three-accounts.gif)

## Installation:

To run this project, you need to have Node.js and npm installed on your machine. Follow the steps below to set up and run the project:

1. Clone repo:
```bash
git clone https://github.com/ioanamadaras/commotion
```

2. Navigate to project directory:
```bash
cd commotion
```

3. Install the dependencies and run the frontend:
```bash
cd client
npm install
npm run dev
```

> (In a separate terminal)

4. Define `MONGO_URI` / `JWT_SECRET` and `PORT` in a new .env file in the `/server` directory

5. Navigate to the server directory and install the dependencies:
```bash
cd server
npm install
npm run dev
```