import { getTutorials } from "@/lib/firebase/firestore";
import BlogLayout from "@/components/BlogLayout";

import Markdown from 'react-markdown'
import Image from 'next/image'
import GoogleAdsenseScript from "@/components/GAdsense";
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";
import Link from 'next/link'

export const dynamic = "force-dynamic"; //for ssr while using app router

export default async function Home() {
  const firestoreData = await getTutorials(); //fetch data from firestore

  let subjectDetails;
  let topicContent;  

  firestoreData.map(data => {
    if(data.id === "blogs"){
        subjectDetails = data;
    }
  });
  
  return (
    <>
      <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
        <div className="min-h-screen flex flex-col">
          <div className="mt-24 ml-9 mr-9 mb-9 prose max-w-none">
            {
              subjectDetails.content.map((data) => {
                return (
                  <div class="relative flex flex-col my-6 bg-white shadow-sm border border-slate-200 rounded-lg">
                    <div class="p-4">
                      <h5 class="mb-2 text-slate-800 text-xl font-semibold">
                        {data.title}
                      </h5>
                      <p class="text-slate-600 leading-normal font-light">
                        {data.shortDesc}
                      </p>

                      <Link href={"/" + subjectDetails.id + "/" + data.url} class="rounded-md bg-teal-700 py-2 px-4 mt-6 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-teal-600 focus:shadow-none active:bg-teal-600 hover:bg-teal-600 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none" type="button">
                        Read more
                      </Link>
                    </div>
                  </div>
                );
              })
            }
            <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
          </div>
        </div>
      </BlogLayout>
    </>
  );
}

export async function generateMetadata() {
  const firestoreData = await getTutorials(); //fetch data from firestore

  let subjectDetails;
  let title;
  let desc;
  let keywords;

  firestoreData.map(data => {
    if(data.id === "blogs"){
        subjectDetails = data;
    }
  });
      title = subjectDetails.titleTag;
      desc = subjectDetails.descriptionTag;
      keywords = subjectDetails.keywords;
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
