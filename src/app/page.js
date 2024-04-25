import { getTutorials } from "@/lib/firebase/firestore";
import Layout from "@/components/Layout";

export const dynamic = "force-dynamic"; //for ssr while using app router

export default async function Home() {
  const firestoreData = await getTutorials(); //fetch data from firestore

  let subjectDetails;
  let topicContent;

  firestoreData.map(data => {
    if(data.id === "flutter"){
        subjectDetails = data;
        console.log("subjectDetails: ", subjectDetails);
    }
  });
  subjectDetails.content.map(data => {
    if(data.url === "introduction") {
        topicContent = data.content;
        console.log("topicContent: ", topicContent);
    }
  });

  return (
    <Layout subjectDetails = {subjectDetails} firestoreData = {firestoreData}>
        <div className="min-h-screen flex flex-col">
            <div className="m-32">
                <p>{topicContent}</p>
            </div>
        </div>
    </Layout>
  );
}
