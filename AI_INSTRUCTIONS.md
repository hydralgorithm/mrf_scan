# AI Instructions for Project Setup

This document provides a step-by-step guide for an AI to set up and run the Pneumonia Detection project.

## Step 1: Unzip the Dataset

The project's dataset is stored in `data.zip`. You must unzip this file to create the `data` directory in the project root.

**Action:**
Extract `data.zip` into the project's root directory. The final structure should be `data/raw/...`.

## Step 2: Set Up the Backend

The backend is a Python application that requires a virtual environment and dependencies from `requirements.txt`.

**Action:**
1.  Create a Python virtual environment.
2.  Activate the virtual environment.
3.  Install the required packages by running:
    ```bash
    pip install -r requirements.txt
    ```

## Step 3: Set Up the Frontend

The frontend is a React application located in the `app/dashboard` directory.

**Action:**
1.  Navigate to the `app/dashboard` directory.
2.  Install the Node.js dependencies by running:
    ```bash
    npm install
    ```

## Step 4: Run the Application

The application consists of a backend API and a frontend client. They must be run in separate terminals.

### Backend
**Action:**
1.  Ensure the Python virtual environment is activated.
2.  From the project's root directory, start the FastAPI server by running:
    ```bash
    uvicorn src.api.main:app --reload
    ```
3.  The backend will be running at `http://127.0.0.1:8000`.

### Frontend
**Action:**
1.  Navigate to the `app/dashboard` directory.
2.  Start the React development server by running:
    ```bash
    npm run dev
    ```
3.  The frontend will be accessible at `http://localhost:5173`.

After completing these steps, the application will be fully operational.
