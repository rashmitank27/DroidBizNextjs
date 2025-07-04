import Script from 'next/script';


const GoogleAdsenseScript = () => {
    return (
      <Script
      async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`}
      crossorigin="anonymous"
      />
    );
  };
  
  export default GoogleAdsenseScript;
