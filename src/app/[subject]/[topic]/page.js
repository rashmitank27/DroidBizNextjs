import { getTutorials } from "@/lib/firebase/firestore";
import Layout from "@/components/Layout";
import Markdown from 'react-markdown'
import GoogleAdsenseScript from "@/components/GAdsense";
import Image from 'next/image'
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";

export const dynamic = "force-dynamic"; //for ssr while using app router

export default async function TutorialPage({ params }) {

    let subject = params.subject;
    let topic = params.topic;

    const firestoreData = await getTutorials(); //fetch data from firestore

    let subjectDetails;
    let topicContent;

    firestoreData.map(data => {
        if (data.id === subject) {
            subjectDetails = data;
        }
    });

    subjectDetails.content.map(data => {
        if (data.url === topic) {
            topicContent = data.content.replaceAll("/n", "  \n").replaceAll("/t", " ");
        }
    });

    const paragraphs = topicContent.split(/show-adsense-ad/); // Split content
    const contentWithAds = [];

    paragraphs.forEach((paragraph, index) => {
        paragraph.replaceAll("show-adsense-ad", " ");
        contentWithAds.push(<Markdown key={`p-${index}`} remarkPlugins={[remarkGfm]}
            components={
                {
                    img: (props) => (
                        <Image className="mx-auto" src={props.src} alt={props.alt} />
                    )
                }
            }>{paragraph}</Markdown>);

        contentWithAds.push(<InArticleAd key={`ad-${index}`} />);
    });

    return (
        <Layout subjectDetails={subjectDetails} firestoreData={firestoreData}>
            <div className="min-h-screen flex flex-col bg-white">
                <div className="md:ml-72 mt-24 ml-9 mr-9 mb-9 prose max-w-none">
                    {contentWithAds}
                    <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
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
    let keywords;

    const firestoreData = await getTutorials(); //fetch data from firestore

    let subjectDetails;

    firestoreData.map(data => {
        if (data.id === subject) {
            subjectDetails = data;
        }
    });

    subjectDetails.content.map(data => {
        if (data.url === topic) {
            title = data.titleTag;
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
        },
        verification: {
            google: 'DzEo_8OpTDL4aq1q8mfcjmCQEaQC5jGbJcOm58hzRhs',
        }
    }
}
