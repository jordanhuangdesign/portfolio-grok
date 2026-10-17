(function(){
  var PAGES={"index.html":"/","from-legacy-pos-to-mobile-first-experience.html":"/from-legacy-pos-to-mobile-first-experience","reimagined-loan-app-experience.html":"/reimagined-loan-app-experience"};
  function fileFor(url){ if(!url||url==="/") return "index.html"; return url.replace(/^\//,"")+".html"; }
  var file=(location.pathname.split("/").pop()||"index.html");
  var current={url:PAGES[file]||"/",search:""};
  var _fetch=window.fetch;
  window.fetch=function(input,init){
    try{
      var u=typeof input==="string"?input:(input&&input.url)||"";
      var m=u.match(/_assets\/v11\/([0-9a-f]{40}\.svg)/);
      if(m && window.__FS_SVGS && window.__FS_SVGS[m[1]]!=null){
        return Promise.resolve(new Response(window.__FS_SVGS[m[1]],{status:200,headers:{"Content-Type":"image/svg+xml"}}));
      }
    }catch(e){}
    return _fetch.apply(this,arguments);
  };
  var hist={
    get current(){return current;},
    get href(){return location.href;},
    push:function(t){ var f=fileFor(t.url); if(f!==file){ location.href=f+(t.search||""); } else { window.scrollTo(0,0); } },
    forward:function(){history.forward();}, back:function(){history.back();}
  };
  function rel(p){ return p && p.charAt(0)==="/" ? "assets"+p : p; }
  var rt=new window.__FigmaSites.SitesRuntime({
    container:document.getElementById("container"),
    env:"published",
    bundleId:"25116155-2e45-484c-a3fc-feb4b9dd2fd6",
    loadComponentsOverNetwork:true,
    assetsVersion:"v11", fontsVersion:"v1", videosVersion:"v1", codeComponentsVersion:"v2",
    withBaseStyles:true,
    history:hist,
    getAssetURL:function(h){ return "assets/_assets/v11/"+h; },
    getFontURL:function(h,kind){ return kind==="CUSTOM" ? "assets/_user_fonts/v1/"+h : rel(h); },
    getVideoURL:function(n,h){ return "assets/_videos/v1/"+h; },
    getPage:function(url){ return Promise.resolve({resource:window.__FS_PAGES[url]||window.__FS_PAGES["/"],cmsResource:null}); },
    renderOptions:{metronomeEnabled:true,transform3dEnabled:false},
    enableMetaTags:true, isFigmake:false
  });
  rt.setLocation(current,true);
  window.__sitesRuntime=rt;
  // Offline-copy fix: the Figma runtime lays out some animated components (e.g. the
  // case-study slideshow) with the breakpoint that was active at load, so dragging the
  // window across a breakpoint leaves them at the wrong size. Re-render cleanly by
  // reloading when the breakpoint band changes (desktop >=1280 / tablet 800-1279 / mobile <800).
  function band(){ var w=window.innerWidth; return w>=1280?"d":(w>=800?"t":"m"); }
  var startBand=band(), bandTimer=null;
  window.addEventListener("resize",function(){
    clearTimeout(bandTimer);
    bandTimer=setTimeout(function(){ if(band()!==startBand){ location.reload(); } },300);
  });
})();