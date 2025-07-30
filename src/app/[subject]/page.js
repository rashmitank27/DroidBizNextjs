import { getTutorials, getHomepageBySubject } from "@/lib/data/excelReader";
import BlogLayout from "@/components/BlogLayout";
import Markdown from 'react-markdown'
import GoogleAdsenseScript from "@/components/GAdsense";
import Image from 'next/image'
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function SubjectHomepage({ params }) {
    const subject = params.subject;

    try {
        // Get both regular tutorials data and homepage data
        const firestoreData = await getTutorials();
        const homepageData = await getHomepageBySubject(subject);

        if (!firestoreData || firestoreData.length === 0) {
            notFound();
        }

        // Find subject details for navigation
        let subjectDetails = null;
        for (const data of firestoreData) {
            if (data.id === subject) {
                subjectDetails = data;
                break;
            }
        }

        if (!subjectDetails) {
            notFound();
        }

        // Use homepage data if available, otherwise fall back to generated content
        if (!homepageData) {
            // Fallback: show message that homepage is not configured
            return (
                <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
                    <div className="min-h-screen flex flex-col bg-white">
                        <div className="mt-24 ml-9 mr-9 mb-9 prose max-w-none">
                            <div className="text-center py-12">
                                <h1 className="text-3xl font-bold text-slate-800 mb-4">
                                    {subjectDetails.name} Tutorials
                                </h1>
                                <p className="text-slate-600 mb-8">
                                    Homepage content is being configured. Please check back soon!
                                </p>
                                <Link 
                                    href={`/${subject}/tutorials`}
                                    className="inline-flex items-center rounded-md bg-teal-700 py-3 px-6 text-white hover:bg-teal-600"
                                >
                                    View All Tutorials
                                </Link>
                            </div>
                        </div>
                    </div>
                </BlogLayout>
            );
        }

        return (
            <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
                <div className="min-h-screen flex flex-col bg-white">
                    <div className="mt-16 ml-4 mr-4 mb-4">
                        {/* Hero Section */}
                        <div className="text-center py-12 mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
                                {homepageData.title}
                            </h1>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                {homepageData.shortDesc}
                            </p>
                        </div>

                        {/* Sections Grid */}
                        <div className="max-w-6xl mx-auto">
                            {homepageData.sections && homepageData.sections.map((section, sectionIndex) => (
                                <div key={section.name} className="mb-16">
                                    {/* Section Header */}
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-bold text-slate-800 mb-3">
                                            {section.name}
                                        </h2>
                                        <p className="text-lg text-slate-600 leading-relaxed">
                                            {section.description}
                                        </p>
                                    </div>

                                    {/* Tutorials Grid */}
                                    <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                                        {section.tutorials && section.tutorials.map((tutorial, tutorialIndex) => (
                                            <Link
                                                key={tutorial.url}
                                                href={`/${subject}/${tutorial.url}`}
                                                className="group block p-6 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-teal-700 transition-colors duration-200 leading-tight">
                                                            {tutorial.title}
                                                        </h3>
                                                    </div>
                                                    <div className="ml-3 flex-shrink-0">
                                                        <svg 
                                                            className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors duration-200" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Add advertisement after every 2 sections */}
                                    {(sectionIndex + 1) % 2 === 0 && (
                                        <div className="mt-12">
                                            <InArticleAd className="max-w-3xl mx-auto" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>



                        {/* Final Advertisement */}
                        <div className="mt-12">
                            <InArticleAd className="max-w-3xl mx-auto" />
                        </div>
                    </div>
                </div>
            </BlogLayout>
        );
    } catch (error) {
        console.error('Error loading subject homepage:', error);
        notFound();
    }
}

export async function generateMetadata({ params }) {
    const subject = params.subject;

    try {
        const homepageData = await getHomepageBySubject(subject);
        
        if (homepageData) {
            return {
                title: homepageData.titleTag || homepageData.title,
                description: homepageData.descriptionTag || homepageData.shortDesc,
                keywords: homepageData.keywords,
                openGraph: {
                    title: homepageData.titleTag || homepageData.title,
                    description: homepageData.descriptionTag || homepageData.shortDesc,
                    locale: 'en_US',
                    siteName: 'www.droidbiz.in'
                },
                verification: {
                    google: 'DzEo_8OpTDL4aq1q8mfcjmCQEaQC5jGbJcOm58hzRhs',
                }
            };
        }

        // Fallback metadata
        const firestoreData = await getTutorials();
        let subjectDetails = null;

        for (const data of firestoreData) {
            if (data.id === subject) {
                subjectDetails = data;
                break;
            }
        }

        if (subjectDetails) {
            const title = `${subjectDetails.name} Tutorials - Complete Guide`;
            const description = `Learn ${subjectDetails.name} programming with our comprehensive tutorial series.`;
            
            return {
                title: title,
                description: description,
                keywords: `${subjectDetails.name.toLowerCase()}, programming, tutorial`,
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
        }

        return {
            title: 'Programming Tutorials',
            description: 'Comprehensive programming tutorials and guides.'
        };
    } catch (error) {
        console.error('Error generating subject homepage metadata:', error);
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
                if (subject.id && subject.id !== 'blogs') {
                    params.push({
                        subject: subject.id
                    });
                }
            }
        }

        return params;
    } catch (error) {
        console.error('Error generating static params for subject homepages:', error);
        return [];
    }
}