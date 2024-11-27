import { getTutorials } from "@/lib/firebase/firestore";
import BlogLayout from "@/components/BlogLayout";
import Markdown from 'react-markdown'
import GoogleAdsenseScript from "@/components/GAdsense";
import Image from 'next/image'
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";

export const dynamic = "force-dynamic"; //for ssr while using app router

export default async function BlogPage({ params }) {
  
    let blog = params.blog;

    const firestoreData = await getTutorials(); //fetch data from firestore

    let subjectDetails;
    let topicContent;

    firestoreData.map(data => {
        if(data.id === "blogs"){
            subjectDetails = data;
        }
    });

    subjectDetails.content.map(data => {
        if(data.url === blog) {
            topicContent = data.content.replaceAll("/n", "  \n").replaceAll("/t", " \t");
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
        <BlogLayout subjectDetails = {subjectDetails} firestoreData = {firestoreData}>
            <div className="min-h-screen flex flex-col">
                <div className="mt-24 ml-9 mr-9 mb-9 prose max-w-none bg-white">
                    {contentWithAds}
                    <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
                </div>
            </div>
        </BlogLayout>
    )
  }

  export async function generateMetadata({ params }) {
    let blog = params.blog;

    let title;
    let desc;
    let keywords;

    const firestoreData = await getTutorials(); //fetch data from firestore
  
    let subjectDetails;
  
    firestoreData.map(data => {
        if(data.id === "blogs"){
            subjectDetails = data;
        }
    });

    subjectDetails.content.map(data => {
        if(data.url === blog) {
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
