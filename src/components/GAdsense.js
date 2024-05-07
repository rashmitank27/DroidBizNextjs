import Script from 'next/script';


const GoogleAdsenseScript = () => {
    return (
      <Script
      async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7919093913529741"
      crossorigin="anonymous"
      />
    );
  };
  
  export default GoogleAdsenseScript;