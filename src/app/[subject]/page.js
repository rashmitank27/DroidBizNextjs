// Updated src/app/[subject]/page.js - Support for hyphenated URLs
import { getTutorials } from "@/lib/data/excelReader";
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

// Helper function to convert URL slug back to various formats for matching
function createSlugVariations(subject) {
    return [
        subject,                          // jetpack-compose
        subject.replace(/-/g, '_'),       // jetpack_compose  
        subject.replace(/-/g, ''),        // jetpackcompose
        subject.replace(/-/g, ' '),       // jetpack compose
    ];
}

// Function to get tutorial home data with flexible matching
async function getTutorialHomeData(subject) {
    try {
        const fs = require('fs');
        const path = require('path');
        const cacheDir = path.join(process.cwd(), '.next-cache');
        const homeDataPath = path.join(cacheDir, 'tutorial_home.json');
        
        if (!fs.existsSync(homeDataPath)) {
            return null;
        }
        
        const homeData = JSON.parse(fs.readFileSync(homeDataPath, 'utf8'));
        
        if (homeData.content && Array.isArray(homeData.content)) {
            // Try multiple slug variations to find a match
            const slugVariations = createSlugVariations(subject);
            
            for (const variation of slugVariations) {
                const subjectHome = homeData.content.find(item => 
                    item.url === variation || 
                    item.url === subject ||
                    item.url.replace(/_/g, '-') === subject ||
                    item.url.replace(/-/g, '_') === subject.replace(/-/g, '_')
                );
                
                if (subjectHome) {
                    return subjectHome;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error loading tutorial home data:', error);
        return null;
    }
}

// Function to find subject details with flexible matching
function findSubjectDetails(firestoreData, subject) {
    // Try direct match first
    let subjectDetails = firestoreData.find(data => data.id === subject);
    
    if (subjectDetails) {
        return subjectDetails;
    }
    
    // Try with slug variations
    const slugVariations = createSlugVariations(subject);
    
    for (const variation of slugVariations) {
        subjectDetails = firestoreData.find(data => 
            data.id === variation ||
            data.id.replace(/_/g, '-') === subject ||
            data.id.replace(/-/g, '_') === subject.replace(/-/g, '_')
        );
        
        if (subjectDetails) {
            return subjectDetails;
        }
    }
    
    return null;
}

export default async function SubjectHomepage({ params }) {
    const subject = params.subject; // This will be "jetpack-compose" from URL

    try {
        // Get regular tutorials data for navigation
        const firestoreData = await getTutorials();
        
        // Get tutorial home content
        const tutorialHomeData = await getTutorialHomeData(subject);

        if (!firestoreData || firestoreData.length === 0) {
            notFound();
        }

        // Find subject details with flexible matching
        const subjectDetails = findSubjectDetails(firestoreData, subject);

        if (!subjectDetails) {
            notFound();
        }

        // If no tutorial home data found, show fallback
        if (!tutorialHomeData) {
            return (
                <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
                    <div className="min-h-screen flex flex-col bg-white">
                        <div className="mt-24 ml-9 mr-9 mb-9">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold text-slate-800 mb-4">
                                    {subjectDetails.name} Tutorial
                                </h1>
                                <p className="text-slate-600 mb-8">
                                    Tutorial home content is being configured. Please check back soon!
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

        // Split content by ad markers and prepare content with ads
        const contentText = tutorialHomeData.content?.replaceAll("/n", "  \n")?.replaceAll("/t", " \t") || "";
        const paragraphs = contentText.split(/show-adsense-ad/);
        const contentWithAds = [];

        paragraphs.forEach((paragraph, index) => {
            if (paragraph.trim()) {
                const cleanedParagraph = paragraph.replace(/show-adsense-ad/g, " ");
                contentWithAds.push(
                    <Markdown 
                        key={`p-${index}`} 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            img: (props) => (
                                <Image 
                                    className="mx-auto" 
                                    src={props.src} 
                                    alt={props.alt || "Tutorial Image"} 
                                    width={800}
                                    height={400}
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                            )
                        }}
                    >
                        {cleanedParagraph}
                    </Markdown>
                );
            }

            // Add ad after each paragraph (except the last one)
            if (index < paragraphs.length - 1) {
                contentWithAds.push(<InArticleAd key={`ad-${index}`} />);
            }
        });

        // Render blog-style homepage
        return (
            <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
                <div className="min-h-screen flex flex-col bg-white">
                    <div className="mt-24 ml-9 mr-9 mb-9 prose max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-strong:text-slate-800 prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
                        {/* Add title as first heading if not already in content */}
                        {!contentText.startsWith('# ') && (
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
                                {tutorialHomeData.title}
                            </h1>
                        )}
                        
                        {/* Render content with ads */}
                        {contentWithAds}
                        
                        {/* Final advertisement */}
                        <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
                    </div>
                </div>
            </BlogLayout>
        );

    } catch (error) {
        console.error('Error loading subject homepage:', error);
        notFound();
    }
}

// Generate metadata for SEO with flexible matching
export async function generateMetadata({ params }) {
    const subject = params.subject;
    
    try {
        const tutorialHomeData = await getTutorialHomeData(subject);
        
        if (tutorialHomeData) {
            return {
                title: tutorialHomeData.title,
                description: tutorialHomeData.descriptionTag,
                keywords: tutorialHomeData.keywords,
                openGraph: {
                    title: tutorialHomeData.title,
                    description: tutorialHomeData.descriptionTag,
                    type: 'article',
                    locale: 'en_US',
                    siteName: 'www.droidbiz.in'
                },
                verification: {
                    google: 'DzEo_8OpTDL4aq1q8mfcjmCQEaQC5jGbJcOm58hzRhs',
                }
            };
        }
        
        // Fallback metadata with proper display name
        const displayName = subject.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return {
            title: `${displayName} Tutorial - Complete Programming Guide`,
            description: `Learn ${displayName} programming with comprehensive tutorials and examples. Master ${displayName} development step by step.`,
            keywords: `${subject.replace(/-/g, ', ')}, programming, tutorial, development, guide`,
            openGraph: {
                title: `${displayName} Tutorial - Complete Programming Guide`,
                description: `Learn ${displayName} programming with comprehensive tutorials and examples.`,
                type: 'article',
                locale: 'en_US',
                siteName: 'www.droidbiz.in'
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Programming Tutorial',
            description: 'Learn programming with comprehensive tutorials and guides.',
        };
    }
}

// // Updated src/app/[subject]/page.js - Blog-style homepage with markdown and ads
// import { getTutorials } from "@/lib/data/excelReader";
// import BlogLayout from "@/components/BlogLayout";
// import Markdown from 'react-markdown'
// import GoogleAdsenseScript from "@/components/GAdsense";
// import Image from 'next/image'
// import remarkGfm from "remark-gfm";
// import { InArticleAd } from "@/components/AdUnit";
// import { notFound } from 'next/navigation';
// import Link from 'next/link';

// export const dynamic = "force-static";
// export const revalidate = 3600;

// // Function to get tutorial home data
// async function getTutorialHomeData(subject) {
//     try {
//         const fs = require('fs');
//         const path = require('path');
//         const cacheDir = path.join(process.cwd(), '.next-cache');
//         const homeDataPath = path.join(cacheDir, 'tutorial_home.json');
        
//         if (!fs.existsSync(homeDataPath)) {
//             return null;
//         }
        
//         const homeData = JSON.parse(fs.readFileSync(homeDataPath, 'utf8'));
        
//         if (homeData.content && Array.isArray(homeData.content)) {
//             const subjectHome = homeData.content.find(item => item.url === subject);
//             return subjectHome;
//         }
        
//         return null;
//     } catch (error) {
//         console.error('Error loading tutorial home data:', error);
//         return null;
//     }
// }

// export default async function SubjectHomepage({ params }) {
//     const subject = params.subject;

//     try {
//         // Get regular tutorials data for navigation
//         const firestoreData = await getTutorials();
        
//         // Get tutorial home content
//         const tutorialHomeData = await getTutorialHomeData(subject);

//         if (!firestoreData || firestoreData.length === 0) {
//             notFound();
//         }

//         // Find subject details for navigation
//         let subjectDetails = null;
//         for (const data of firestoreData) {
//             if (data.id === subject) {
//                 subjectDetails = data;
//                 break;
//             }
//         }

//         if (!subjectDetails) {
//             notFound();
//         }

//         // If no tutorial home data found, show fallback
//         if (!tutorialHomeData) {
//             return (
//                 <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
//                     <div className="min-h-screen flex flex-col bg-white">
//                         <div className="mt-24 ml-9 mr-9 mb-9">
//                             <div className="text-center">
//                                 <h1 className="text-4xl font-bold text-slate-800 mb-4">
//                                     {subjectDetails.name} Tutorial
//                                 </h1>
//                                 <p className="text-slate-600 mb-8">
//                                     Tutorial home content is being configured. Please check back soon!
//                                 </p>
//                                 <Link 
//                                     href={`/${subject}/tutorials`}
//                                     className="inline-flex items-center rounded-md bg-teal-700 py-3 px-6 text-white hover:bg-teal-600"
//                                 >
//                                     View All Tutorials
//                                 </Link>
//                             </div>
//                         </div>
//                     </div>
//                 </BlogLayout>
//             );
//         }

//         // Split content by ad markers and prepare content with ads (same as blog page)
//         const contentText = tutorialHomeData.content?.replaceAll("/n", "  \n")?.replaceAll("/t", " \t") || "";
//         const paragraphs = contentText.split(/show-adsense-ad/);
//         const contentWithAds = [];

//         paragraphs.forEach((paragraph, index) => {
//             if (paragraph.trim()) {
//                 const cleanedParagraph = paragraph.replace(/show-adsense-ad/g, " ");
//                 contentWithAds.push(
//                     <Markdown 
//                         key={`p-${index}`} 
//                         remarkPlugins={[remarkGfm]}
//                         components={{
//                             img: (props) => (
//                                 <Image 
//                                     className="mx-auto" 
//                                     src={props.src} 
//                                     alt={props.alt || "Tutorial Image"} 
//                                     width={800}
//                                     height={400}
//                                     style={{ maxWidth: '100%', height: 'auto' }}
//                                 />
//                             )
//                         }}
//                     >
//                         {cleanedParagraph}
//                     </Markdown>
//                 );
//             }

//             // Add ad after each paragraph (except the last one)
//             if (index < paragraphs.length - 1) {
//                 contentWithAds.push(<InArticleAd key={`ad-${index}`} />);
//             }
//         });

//         // Render blog-style homepage (same layout and styling as blog page)
//         return (
//             <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
//                 <div className="min-h-screen flex flex-col bg-white">
//                     <div className="mt-24 ml-9 mr-9 mb-9 prose max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-strong:text-slate-800 prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
//                         {/* Add title as first heading if not already in content */}
//                         {!contentText.startsWith('# ') && (
//                             <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
//                                 {tutorialHomeData.title}
//                             </h1>
//                         )}
                        
//                         {/* Render content with ads */}
//                         {contentWithAds}
                        
//                         {/* Final advertisement (same as blog page) */}
//                         <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
//                     </div>
//                 </div>
//             </BlogLayout>
//         );

//     } catch (error) {
//         console.error('Error loading subject homepage:', error);
//         notFound();
//     }
// }

// // Generate metadata for SEO (same pattern as blog page)
// export async function generateMetadata({ params }) {
//     const subject = params.subject;
    
//     try {
//         const tutorialHomeData = await getTutorialHomeData(subject);
        
//         if (tutorialHomeData) {
//             return {
//                 title: tutorialHomeData.title,
//                 description: tutorialHomeData.descriptionTag,
//                 keywords: tutorialHomeData.keywords,
//                 openGraph: {
//                     title: tutorialHomeData.title,
//                     description: tutorialHomeData.descriptionTag,
//                     type: 'article',
//                     locale: 'en_US',
//                     siteName: 'www.droidbiz.in'
//                 },
//                 verification: {
//                     google: 'DzEo_8OpTDL4aq1q8mfcjmCQEaQC5jGbJcOm58hzRhs',
//                 }
//             };
//         }
        
//         // Fallback metadata
//         const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
//         return {
//             title: `${subjectName} Tutorial - Complete Programming Guide`,
//             description: `Learn ${subjectName} programming with comprehensive tutorials and examples. Master ${subjectName} development step by step.`,
//             keywords: `${subject}, programming, tutorial, development, guide`,
//             openGraph: {
//                 title: `${subjectName} Tutorial - Complete Programming Guide`,
//                 description: `Learn ${subjectName} programming with comprehensive tutorials and examples.`,
//                 type: 'article',
//                 locale: 'en_US',
//                 siteName: 'www.droidbiz.in'
//             },
//         };
//     } catch (error) {
//         console.error('Error generating metadata:', error);
//         return {
//             title: 'Programming Tutorial',
//             description: 'Learn programming with comprehensive tutorials and guides.',
//         };
//     }
// }