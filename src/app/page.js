import { getTutorials } from "@/lib/data/excelReader";
import BlogLayout from "@/components/BlogLayout";
import Markdown from 'react-markdown'
import Image from 'next/image'
import GoogleAdsenseScript from "@/components/GAdsense";
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";
import Link from 'next/link'

export const dynamic = "force-static"; // Changed to static for better performance with Excel
export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  try {
    const firestoreData = await getTutorials(); // fetch data from Excel files

    if (!firestoreData || firestoreData.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Data Available</h1>
            <p>Unable to load tutorial data. Please check your Excel files.</p>
          </div>
        </div>
      );
    }

    let subjectDetails = null;

    // Find blog details
    for (const data of firestoreData) {
      if (data.id === "blogs") {
        subjectDetails = data;
        break;
      }
    }

    if (!subjectDetails || !subjectDetails.content) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Blog Data Not Available</h1>
            <p>Unable to load blog posts. Please check your Blogs.xlsx file.</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
          <div className="min-h-screen flex flex-col">
            <div className="mt-24 ml-9 mr-9 mb-9 prose max-w-none">
              {subjectDetails.content.map((data, index) => {
                const shortDesc = data.shortDesc
    
                
                return (
                  <div key={data.id || index} className="relative flex flex-col my-6 bg-white shadow-sm border border-slate-200 rounded-lg">
                    <div className="p-4">
                      <h5 className="mb-2 text-slate-800 text-xl font-semibold">
                        {data.title || 'Untitled Post'}
                      </h5>
                      <div className="text-slate-600 leading-normal font-light">
                        <Markdown remarkPlugins={[remarkGfm]}>
                          {shortDesc.replaceAll("/n", "  \n").replaceAll("/t", " \t")}
                        </Markdown>
                      </div>

                      <Link
                        href={"/" + subjectDetails.id + "/" + data.url}
                        className="rounded-md bg-teal-700 py-2 px-4 mt-6 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-teal-600 focus:shadow-none active:bg-teal-600 hover:bg-teal-600 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none inline-block"
                      >
                        Read more
                      </Link>
                    </div>
                  </div>
                );
              })}
              <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
            </div>
          </div>
        </BlogLayout>
      </>
    );
  } catch (error) {
    console.error('Error loading homepage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Data</h1>
          <p>An error occurred while loading the data. Please try again later.</p>
          <p className="text-sm text-gray-600 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }
}

export async function generateMetadata() {
  try {
    const firestoreData = await getTutorials();

    if (!firestoreData || firestoreData.length === 0) {
      return {
        title: 'DroidBiz - Programming Tutorials',
        description: 'Learn programming with comprehensive tutorials and examples.',
        keywords: 'programming, tutorials, kotlin, android development'
      };
    }

    let subjectDetails = null;
    let title = 'DroidBiz - Programming Tutorials';
    let desc = 'Learn programming with comprehensive tutorials and examples.';
    let keywords = 'programming, tutorials, kotlin, android development';

    // Find blog details for metadata
    for (const data of firestoreData) {
      if (data.id === "blogs") {
        subjectDetails = data;
        break;
      }
    }

    if (subjectDetails) {
      title = subjectDetails.titleTag || title;
      desc = subjectDetails.descriptionTag || desc;
      keywords = subjectDetails.keywords || keywords;
    }

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
    };
  } catch (error) {
    console.error('Error generating homepage metadata:', error);
    return {
      title: 'DroidBiz - Programming Tutorials',
      description: 'Learn programming with comprehensive tutorials and examples.',
      keywords: 'programming, tutorials, kotlin, android development'
    };
  }
}