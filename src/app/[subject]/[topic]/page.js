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

    firestoreData.map(data => {
        if(data.id === subject){
            subjectDetails = data;
        }
    });

    subjectDetails.content.map(data => {
        if(data.url === topic) {
            topicContent = data.content.replaceAll("/n", "  \n").replaceAll("\t", " ");
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
                                <Image src={props.src} alt={props.alt} />
                            )
                        }
                        }>{topicContent}
                    </Markdown>
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