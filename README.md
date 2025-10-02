## TO RUN THE FIREBASE FUNCTIONS LOCALLY
<!-- Set secrets -->
firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

<!-- emulate functions on local server -->
firebase emulators:start --only functions

<!-- run dev server -->
npm run dev

<!-- to build -->
npm run build

<!-- to deploy functions -->
firebase deploy --only functions

<!-- to deploy hosting -->
firebase deploy --only hosting --project default