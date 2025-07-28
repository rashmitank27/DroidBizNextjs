import { getTutorials } from "@/lib/data/excelReader";
import Layout from "@/components/Layout";
import Markdown from 'react-markdown'
import GoogleAdsenseScript from "@/components/GAdsense";
import Image from 'next/image'
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";
import { notFound } from 'next/navigation';

export const dynamic = "force-static"; // Changed to static for better performance with Excel
export const revalidate = 3600; // Revalidate every hour

export default async function TutorialPage({ params }) {
    const subject = params.subject;
    const topic = params.topic;

    try {
        const firestoreData = await getTutorials(); // fetch data from Excel files

        if (!firestoreData || firestoreData.length === 0) {
            notFound();
        }

        let subjectDetails = null;
        let topicContent = null;

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

        // Find topic content
        for (const content of subjectDetails.content) {
            if (content.url === topic) {
                topicContent = "# " + content.title + "\n" + content.content?.replaceAll("/n", "  \n")?.replaceAll("/t", " ") || "";
                break;
            }
        }

        if (!topicContent) {
            notFound();
        }

        // Split content and insert ads
        const paragraphs = topicContent.split(/show-adsense-ad/);
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

        return (
            <Layout subjectDetails={subjectDetails} firestoreData={firestoreData}>
                <div className="min-h-screen flex flex-col bg-white">
                    <div className="md:ml-72 mt-24 ml-9 mr-9 mb-9 prose max-w-none">
                        {contentWithAds}
                        <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
                    </div>
                </div>
            </Layout>
        );
    } catch (error) {
        console.error('Error loading tutorial page:', error);
        notFound();
    }
}

export async function generateMetadata({ params }) {
    const subject = params.subject;
    const topic = params.topic;

    try {
        const firestoreData = await getTutorials();
        
        if (!firestoreData || firestoreData.length === 0) {
            return {
                title: 'Tutorial Not Found',
                description: 'The requested tutorial could not be found.'
            };
        }

        let subjectDetails = null;
        let title = 'Tutorial';
        let desc = '';
        let keywords = '';

        // Find subject details
        for (const data of firestoreData) {
            if (data.id === subject) {
                subjectDetails = data;
                break;
            }
        }

        if (subjectDetails) {
            // Find topic metadata
            for (const content of subjectDetails.content) {
                if (content.url === topic) {
                    title = content.titleTag || content.title || 'Tutorial';
                    desc = content.descriptionTag || content.shortDesc || '';
                    keywords = content.keywords || '';
                    break;
                }
            }
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
        console.error('Error generating metadata:', error);
        return {
            title: 'Tutorial',
            description: 'Programming tutorial and guide.'
        };
    }
}

// Generate static params for all tutorials at build time
export async function generateStaticParams() {
    try {
        const firestoreData = await getTutorials();
        const params = [];

        if (firestoreData && firestoreData.length > 0) {
            for (const subject of firestoreData) {
                if (subject.content && Array.isArray(subject.content)) {
                    for (const topic of subject.content) {
                        if (topic.url && subject.id !== 'blogs') {
                            params.push({
                                subject: subject.id,
                                topic: topic.url
                            });
                        }
                    }
                }
            }
        }

        return params;
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}