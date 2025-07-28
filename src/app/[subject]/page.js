import { getTutorials } from "@/lib/data/excelReader";
import Layout from "@/components/Layout";
import Markdown from 'react-markdown'
import GoogleAdsenseScript from "@/components/GAdsense";
import Image from 'next/image'
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function SubjectIndexPage({ params }) {
    const subject = params.subject;

    try {
        const firestoreData = await getTutorials();

        if (!firestoreData || firestoreData.length === 0) {
            notFound();
        }

        let subjectDetails = null;

        // Find subject details
        for (const data of firestoreData) {
            if (data.id === subject) {
                subjectDetails = data;
                break;
            }
        }

        if (!subjectDetails) {
            notFound();
        }

        // Create index content with tutorial list
        const indexContent = `# ${subjectDetails.name} Tutorials

Welcome to our comprehensive ${subjectDetails.name} tutorial series. Learn ${subjectDetails.name} programming from basics to advanced concepts.

## Tutorial Topics

Below you'll find all available ${subjectDetails.name} tutorials organized in a logical learning sequence:
`;

        return (
            <Layout subjectDetails={subjectDetails} firestoreData={firestoreData}>
                <div className="min-h-screen flex flex-col bg-white">
                    <div className="md:ml-72 mt-24 ml-9 mr-9 mb-9 prose max-w-none">
                        {/* Header content */}
                        <Markdown remarkPlugins={[remarkGfm]}>
                            {indexContent}
                        </Markdown>

                        {/* Tutorial list */}
                        <div className="not-prose mt-8">
                            {subjectDetails.content && subjectDetails.content.map((tutorial, index) => {
                                const shortDesc = 
                                    tutorial.content ? tutorial.content.substring(0, 300).replace(/[#*`]/g, '').replace(/\/n/g, ' ') + '...' : 'No description available';
                                
                                return (
                                    <div key={tutorial.id || index} className="relative flex flex-col my-6 bg-white shadow-sm border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-xl font-semibold text-slate-800 hover:text-teal-700">
                                                    <Link href={`/${subject}/${tutorial.url}`}>
                                                        {tutorial.title || 'Untitled Tutorial'}
                                                    </Link>
                                                </h3>
                                            </div>
                                            
                                            <div className="text-slate-600 leading-relaxed mb-4">
                                                <Markdown remarkPlugins={[remarkGfm]}>
                                                    {shortDesc.replaceAll("/n", " ").replaceAll("/t", " ")}
                                                </Markdown>
                                            </div>

                        

                                            <Link
                                                href={`/${subject}/${tutorial.url}`}
                                                className="inline-flex items-center rounded-md bg-teal-700 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-teal-600 focus:shadow-none active:bg-teal-600 hover:bg-teal-600 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                            >
                                                Read More
                                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add advertisement */}
                        <InArticleAd className="p-2 lg:w-3/4 mx-auto mt-8" />

                        
                    </div>
                </div>
            </Layout>
        );
    } catch (error) {
        console.error('Error loading subject index page:', error);
        notFound();
    }
}

export async function generateMetadata({ params }) {
    const subject = params.subject;

    try {
        const firestoreData = await getTutorials();
        
        if (!firestoreData || firestoreData.length === 0) {
            return {
                title: 'Tutorial Subject Not Found',
                description: 'The requested tutorial subject could not be found.'
            };
        }

        let subjectDetails = null;

        // Find subject details
        for (const data of firestoreData) {
            if (data.id === subject) {
                subjectDetails = data;
                break;
            }
        }

        if (!subjectDetails) {
            return {
                title: 'Tutorial Subject Not Found',
                description: 'The requested tutorial subject could not be found.'
            };
        }

        const title = subjectDetails.titleTag || `${subjectDetails.name} Tutorials - Complete Guide`;
        const description = subjectDetails.descriptionTag || 
            `Learn ${subjectDetails.name} programming with our comprehensive tutorial series. ${subjectDetails.content?.length || 0} tutorials covering everything from basics to advanced concepts.`;
        const keywords = subjectDetails.keywords || `${subjectDetails.name.toLowerCase()}, programming, tutorial, learn ${subjectDetails.name.toLowerCase()}`;

        return {
            title: title,
            description: description,
            keywords: keywords,
            openGraph: {
                title: title,
                description: description,
                locale: 'en_US',
                siteName: 'www.droidbiz.in'
            },
            verification: {
                google: 'DzEo_8OpTDL4aq1q8mfcjmCQEaQC5jGbJcOm58hzRhs',
            }
        };
    } catch (error) {
        console.error('Error generating subject index metadata:', error);
        return {
            title: 'Programming Tutorials',
            description: 'Comprehensive programming tutorials and guides.'
        };
    }
}

// Generate static params for all subjects at build time
export async function generateStaticParams() {
    try {
        const firestoreData = await getTutorials();
        const params = [];

        if (firestoreData && firestoreData.length > 0) {
            for (const subject of firestoreData) {
                // Exclude blogs from subject index pages since blogs have their own structure
                if (subject.id && subject.id !== 'blogs') {
                    params.push({
                        subject: subject.id
                    });
                }
            }
        }

        return params;
    } catch (error) {
        console.error('Error generating static params for subject indexes:', error);
        return [];
    }
}