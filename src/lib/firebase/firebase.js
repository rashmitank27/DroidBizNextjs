import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//     apiKey: process.env.API_KEY,
//     authDomain: process.env.AUTH_DOMAIN,
//     projectId: process.env.projectId,
//     storageBucket: process.env.storageBucket,
//     messagingSenderId: process.env.messagingSenderId,
//     appId: process.env.appId
// };

const firebaseConfig = {
    apiKey: "AIzaSyC4aO3mjR78muVuHSsKauIGx87RsenOKjo",
    authDomain: "droidbiz-angular.firebaseapp.com",
    projectId: "droidbiz-angular",
    storageBucket: "droidbiz-angular.appspot.com",
    messagingSenderId: "11075113010",
    appId: "1:11075113010:web:f64dad631325a8b9e1ec2b"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { app, db } 