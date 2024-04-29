import { getTutorials } from "@/lib/firebase/firestore";
import Layout from "@/components/Layout";
import Markdown from 'react-markdown'

export const dynamic = "force-dynamic"; //for ssr while using app router

export default async function TutorialPage({ params }) {
    console.log("params in TutorialPage: ", params);
  
    let subject = params.subject;
    let topic = params.topic;

    console.log("subject in TutorialPage: ", subject);
    console.log("topic in TutorialPage: ", topic);

    const firestoreData = await getTutorials(); //fetch data from firestore
    console.log("data received: ", firestoreData);

    let subjectDetails;
    let topicContent;

    // if(!subject && !topic) {
    //     console.log("undefined");
    //     firestoreData.map(data => {
    //         if(data.id === "flutter"){
    //             subjectDetails = data;
    //             console.log("subjectDetails: ", subjectDetails);
    //         }
    //     });
    //     subjectDetails.content.map(data => {
    //         if(data.url === "introduction") {
    //             topicContent = data.content;
    //             console.log("topicContent: ", topicContent);
    //         }
    //     });
    // }

    firestoreData.map(data => {
        if(data.id === subject){
            subjectDetails = data;
            console.log("subjectDetails: ", subjectDetails);
        }
    });

    subjectDetails.content.map(data => {
        if(data.url === topic) {
            topicContent = data.content.replace("/n", "  \n");
            console.log("topicContent: ", topicContent);
        }
    });

    return (
        <Layout subjectDetails = {subjectDetails} firestoreData = {firestoreData}>
            <div className="min-h-screen flex flex-col">
                <div className="m-8 prose">
                    <Markdown>{topicContent}</Markdown>
                </div>
            </div>
        </Layout>
    )
  }

  export async function generateMetadata({ params }) {
    let subject = params.subject;
    let topic = params.topic;

    let title;
    let desc;

    const firestoreData = await getTutorials(); //fetch data from firestore
  
    let subjectDetails;
  
    firestoreData.map(data => {
        if(data.id === subject){
            subjectDetails = data;
        }
    });

    subjectDetails.content.map(data => {
        if(data.url === topic) {
            title = data.title;
            desc = data.content;
        }
    });
  
    return {
        title: title,
        description: desc
      }
  }

// export default async function Tutorial({ params }) {
//     let subjectName = params.tutorial;
//     let name = "";
//     console.log("params in page: ", params);
//     console.log("params in page: ", params.tutorial);
//     const data = await getTutorials(params.tutorial);
//     console.log("data received: ", data);
//         if (!data) {
//             console.log("Error: Invalid data received: ", data);
//             name = "";
//         } else {
//             name = data.name;
//         }
//         name = data[0].name
    
//     let subjectDetails;
//     data.map(subject => {
//         if(subject.id === params.tutorial){
//             console.log("subject: ", subject);
//             subjectDetails = subject;
//             console.log("subjectDetails: ", subjectDetails.content);
//         }
//     });
    

//     return (
//         <Layout pageTitle='title' subjectName = {subjectName} subjectDetails = {subjectDetails}>
//             <div className="min-h-screen flex flex-col">
//                 <div className="m-auto">
//                     <h1 className="text-4xl">title</h1>
//                     <p>{name}</p>
//                 </div>
//             </div>
//         </Layout>
//     )
//   }