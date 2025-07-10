## TO RUN THE FIREBASE FUNCTIONS LOCALLY

firebase functions:config:set stripe.secret_key="sk_xxxx_key"
firebase functions:config:set app.url="http://localhost:5173"
firebase functions:config:get > .runtimeconfig.json
firebase emulators:start --only functions

npm run dev