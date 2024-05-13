import { getTutorials } from "@/lib/firebase/firestore";
import Layout from "@/components/Layout";

import Markdown from 'react-markdown'
import Image from 'next/image'
import GoogleAdsenseScript from "@/components/GAdsense";

export const dynamic = "force-dynamic"; //for ssr while using app router

export default async function Home() {
  const firestoreData = await getTutorials(); //fetch data from firestore

  let subjectDetails;
  let topicContent;  

  firestoreData.map(data => {
    if(data.id === "flutter"){
        subjectDetails = data;
    }
  });
  subjectDetails.content.map(data => {
    if(data.url === "introduction") {
        topicContent = data.content.replaceAll("/n", "  \n").replaceAll("/t", " ");
    }
  });

  

  return (
    <Layout subjectDetails = {subjectDetails} firestoreData = {firestoreData}>
        <div className="min-h-screen flex flex-col">
            <div className="md:ml-72 mt-24 ml-9 mr-9 mb-9 prose max-w-none">
                <Markdown 
                  components={
                    {
                      img: (props) => (
                        <Image className = "mx-auto" src={props.src} alt={props.alt} />
                      )
                    }
                }>{topicContent}</Markdown>
                <GoogleAdsenseScript/> 
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
  let keywords;

  firestoreData.map(data => {
    if(data.id === "flutter"){
        subjectDetails = data;
    }
  });
  subjectDetails.content.map(data => {
    if(data.url === "introduction") {
      title = data.title;
      desc = data.descriptionTag;
      keywords = data.keywords;
    }
  });
  return {
    title: title,
    description: desc,
    keywords: keywords,
    openGraph: {
      title: title,
      description: desc,
      locale: 'en_US',
      siteName: 'www.droidbiz.in'
    }
  }

}
