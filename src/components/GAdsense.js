import Script from 'next/script';

const GoogleAdsenseScript = () => {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('AdSense script loaded successfully')
      }}
      onError={(e) => {
        console.error('AdSense script failed to load', e)
      }}
    />
  );
};

export default GoogleAdsenseScript;
