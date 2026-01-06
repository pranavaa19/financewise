

## Running Locally

To run this project on your local machine, please follow these steps:

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 20 or later) and `npm` installed on your system.

### 2. Unzip the Project

If you have downloaded the project as a `.zip` file, unzip it to a location of your choice.

### 3. Install Dependencies

Open your terminal, navigate to the project's root directory, and run the following command to install the necessary packages:

```bash
npm install
```

### 4. Set Up Environment Variables

The project requires Firebase credentials to connect to your Firebase project.

1.  Create a new file named `.env.local` in the root of your project directory.
2.  Copy and paste the following content into the `.env.local` file:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREbase_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

3.  Replace the placeholder values (`YOUR_...`) with your actual Firebase project configuration. You can find these values in the Firebase Console under **Project settings** > **General** > **Your apps** > **SDK setup and configuration**.

### 5. Run the Development Server

Once the dependencies are installed and the environment variables are set, you can start the local development server by running:

```bash
npm run dev
```

This will start the application on `http://localhost:9002` by default. You can now open this URL in your web browser to see the app running.
