import { getTutorials } from "@/lib/firebase/firestore";
import Layout from "@/components/Layout";

import Markdown from 'react-markdown'

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
        topicContent = data.content.replace("/n", "  \n");
        console.log("topicContent: ", topicContent);
    }
  });

  

  return (
    <Layout subjectDetails = {subjectDetails} firestoreData = {firestoreData}>
        <div className="min-h-screen flex flex-col">

        <div className="m-32">
          <ins
            class="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-7919093913529741"
            data-ad-slot="3534351170"
            data-ad-format="auto"
              data-full-width-responsive="true"
          > </ins>
          <script>
          (adsbygoogle = window.adsbygoogle || []).push({});    
          </script>
        </div>

            <div className="m-32 prose">
                <Markdown>{topicContent}</Markdown>
            </div>
        </div>
    </Layout>
  );
}

export async function generateMetadata() {
  // return {
  //   title: "rashmi",
  // }

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
