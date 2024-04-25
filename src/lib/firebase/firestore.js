import { collection, getDoc, getDocs, doc, where } from "firebase/firestore";
import { db } from "./firebase";

export async function getTutorials() {
    try {
        // if (!tutorial) {
        //     console.log("Error: Invalid ID received: ", tutorial);
        //     return;
        // }
        // console.log('params in getTutorial method: ', tutorial);

        const collectionRef = collection(db, 'tutorial');
        const querySnapshot = await getDocs(collectionRef);
        const data = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          return data;

        // const docRef = doc(collection(db, "tutorial"), tutorial);
        // const docSnap = await getDoc(query(docRef, where("name", "==", "Kotlin1")));
        // return {
        //     ...docSnap.data(),
        //     id: docSnap.id
        // };
    } 
    catch (error) {
        console.error('Error getting documents: ', error);
        
        return {
            error: 'failed to fetch data'
        };
    }
    // try {
    //     console.log('params in getTutorial method: ', tutorial);
    //     const collectionRef = collection(db, 'tutorial');
    //     const querySnapshot = await getDocs(collectionRef);
    //     const data = querySnapshot.docs.map((doc) => ({
    //         ...doc.data(),
    //         id: doc.id,
    //       }));
    //       console.log('data in getTutorial method: ', data.map((tutorial) => (tutorial.id)));
        
    //       return data;
    // } 
    // catch (error) {
    //     console.error('Error getting documents: ', error);
        
    //     return {
    //         props: { error: 'failed to fetch data' }
    //     };
    // }
}