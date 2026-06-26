# Licenta

To run this project, you need to have Node.js and npm installed on your machine. Follow the steps below to set up and run the project:

1. Clone the repository:
```bash
git clone [<repository-url>](https://github.com/ioanamadaras/commotion)
```

2. Navigate to the project directory:
```bash
cd commotion
```

3. Install the dependencies and run the frontend:
```bash
cd client
npm install
npm run dev
```

4. Link MONGO_URI to your MongoDB database in a new .env file in the /server directory:
```bash
MONGO_URI=your_mongodb_connection_string
```

5. (in a separate terminal) Navigate to the server directory and install the dependencies:
```bash
cd server
npm install
npm run dev
```