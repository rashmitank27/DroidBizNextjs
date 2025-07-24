import { getTutorials } from "@/lib/data/excelReader";
import BlogLayout from "@/components/BlogLayout";
import Markdown from 'react-markdown'
import GoogleAdsenseScript from "@/components/GAdsense";
import Image from 'next/image'
import remarkGfm from "remark-gfm";
import { InArticleAd } from "@/components/AdUnit";
import { notFound } from 'next/navigation';

export const dynamic = "force-static"; // Changed to static for better performance with Excel
export const revalidate = 3600; // Revalidate every hour

export default async function BlogPage({ params }) {
    const blog = params.blog;

    try {
        const firestoreData = await getTutorials(); // fetch data from Excel files

        if (!firestoreData || firestoreData.length === 0) {
            notFound();
        }

        let subjectDetails = null;
        let topicContent = null;

        // Find blog details
        for (const data of firestoreData) {
            if (data.id === "blogs") {
                subjectDetails = data;
                break;
            }
        }

        if (!subjectDetails) {
            notFound();
        }

        // Find blog content
        for (const content of subjectDetails.content) {
            if (content.url === blog) {
                topicContent = content.content?.replaceAll("/n", "  \n")?.replaceAll("/t", " \t") || "";
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
                                    alt={props.alt || "Blog Image"} 
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
            <BlogLayout subjectDetails={subjectDetails} firestoreData={firestoreData}>
                <div className="min-h-screen flex flex-col bg-white">
                    <div className="mt-24 ml-9 mr-9 mb-9 prose max-w-none">
                        {contentWithAds}
                        <InArticleAd className="p-2 lg:w-3/4 mx-auto" />
                    </div>
                </div>
            </BlogLayout>
        );
    } catch (error) {
        console.error('Error loading blog page:', error);
        notFound();
    }
}

export async function generateMetadata({ params }) {
    const blog = params.blog;

    try {
        const firestoreData = await getTutorials();
        
        if (!firestoreData || firestoreData.length === 0) {
            return {
                title: 'Blog Not Found',
                description: 'The requested blog post could not be found.'
            };
        }

        let subjectDetails = null;
        let title = 'Blog Post';
        let desc = '';
        let keywords = '';

        // Find blog details
        for (const data of firestoreData) {
            if (data.id === "blogs") {
                subjectDetails = data;
                break;
            }
        }

        if (subjectDetails) {
            // Find blog metadata
            for (const content of subjectDetails.content) {
                if (content.url === blog) {
                    title = content.titleTag || content.title || 'Blog Post';
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
        console.error('Error generating blog metadata:', error);
        return {
            title: 'Blog Post',
            description: 'Programming blog post and guide.'
        };
    }
}

// Generate static params for all blog posts at build time
export async function generateStaticParams() {
    try {
        const firestoreData = await getTutorials();
        const params = [];

        if (firestoreData && firestoreData.length > 0) {
            for (const subject of firestoreData) {
                if (subject.id === "blogs" && subject.content && Array.isArray(subject.content)) {
                    for (const blog of subject.content) {
                        if (blog.url) {
                            params.push({
                                blog: blog.url
                            });
                        }
                    }
                    break;
                }
            }
        }

        return params;
    } catch (error) {
        console.error('Error generating static params for blogs:', error);
        return [];
    }
}