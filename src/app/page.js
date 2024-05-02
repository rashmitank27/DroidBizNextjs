import { getTutorials } from "@/lib/firebase/firestore";
import Layout from "@/components/Layout";

import Markdown from 'react-markdown'
import Image from 'next/image'

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
        topicContent = data.content.replaceAll("/n", "  \n");
        console.log("topicContent: ", topicContent);
    }
  });

  

  return (
    <Layout subjectDetails = {subjectDetails} firestoreData = {firestoreData}>
        <div className="min-h-screen flex flex-col">
            <div className="m-32 prose max-w-none">
                <Markdown 
                  components={
                    {
                      img: (props) => (
                        <Image src={props.src} alt={props.alt} />
                      )
                    }
                }>{topicContent}</Markdown>
            </div>
        </div>
    </Layout>
  );
}

export async function generateMetadata() {
  const firestoreData = await getTutorials(); //fetch data from firestore

  let subjectDetails;
  let title;
  let desc;

  firestoreData.map(data => {
    if(data.id === "flutter"){
        subjectDetails = data;
    }
  });
  subjectDetails.content.map(data => {
    if(data.url === "introduction") {
      title = data.title;
      desc = data.content;
    }
  });
  return {
    title: title,
    description: desc
  }

}
