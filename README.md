# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Firebase Cloud Functions and Cron Jobs

A scheduled gcp cloud job is run every hour to perform a http GET operation to the firebase cloud function resolveGradebookResultDiscrepencies. This is used to resolve any gradebook discrepancies between the heavyweight assignment response summary and the lightweight assignment response summary used in the gradebook. This script only accounts for courses with the isActive field set to true.
https://console.cloud.google.com/cloudscheduler

## Admin Panel

The users collection user.permissions must contain admin.
To impersonate another user, they must also contain the impersonate word.
