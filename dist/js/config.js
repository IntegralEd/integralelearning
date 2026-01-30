// Configuration for IntegralELearning.com
// Update these values before deploying to production

export const config = {
  // Chatbot embed URL or embed code
  // Leave empty to show placeholder message
  chatbotEmbedUrl: `<script>
(function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="Yb5-ZOPsnSt9Ju6r3P7C7";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();
</script>`,

  // Webhook endpoint for portfolio request form submissions
  // Example: 'https://hooks.zapier.com/hooks/catch/...'
  portfolioWebhookUrl: '',

  // External links
  integralEdUrl: 'https://www.integral-ed.com/',
  integralEdContactUrl: 'https://www.integral-ed.com/contact'
};
