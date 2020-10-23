const _ = require("lodash");

exports.addCacheHeadersToResult = function addCacheHeadersToResult(
  cacheKeys,
  cdnProvider = "cloudflare"
) {
  if (cacheKeys) {
    if (cacheKeys === "DO_NOT_CACHE") {
      let cacheHeaders =  {"Cache-Control": "private,no-cache,no-store,max-age=0"}
      if(cdnProvider === "akamai") {
        cacheHeaders["Edge-Control"] = "private,no-cache,no-store,max-age=0";
      }
      cacheHeaders["Vary"] =  "Accept-Encoding";
      cacheHeaders["Surrogate-Control"] =  "private,no-cache,no-store,max-age=0";
      return cacheHeaders;
    } else {
      let cacheHeaders =  {"Cache-Control": "public,max-age=15,s-maxage=900,stale-while-revalidate=1000,stale-if-error=14400"}
      if(cdnProvider === "akamai") {
        cacheHeaders["Edge-Control"] = "public,maxage=900,stale-while-revalidate=1000,stale-if-error=14400"
      }
      cacheHeaders["Vary"] =  "Accept-Encoding";

      // Cloudflare Headers
      cacheHeaders["Cache-Tag"] = _(cacheKeys).uniq().join(",");

      //Akamai Headers
      if(cdnProvider === "akamai"){
        cacheHeaders["Edge-Cache-Tag"] = _(cacheKeys).uniq().join(",")
      }
      // Fastly Header
        cacheHeaders["Surrogate-Control"] = "public,max-age=240,stale-while-revalidate=300,stale-if-error=14400"
        cacheHeaders["Surrogate-Key"] = _(cacheKeys).uniq().join(" ");
        return cacheHeaders;
    }
  } else {
    let cacheHeaders =  {"Cache-Control": "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600"}
    if(cdnProvider === "akamai") {
      cacheHeaders["Edge-Control"]="public,maxage=60,stale-while-revalidate=150,stale-if-error=3600"
    }
    cacheHeaders["Vary"] = "Accept-Encoding";
    cacheHeaders["Surrogate-Control"] = "public,max-age=15,s-maxage=60,stale-while-revalidate=150,stale-if-error=3600";
    return cacheHeaders;
  }
};
