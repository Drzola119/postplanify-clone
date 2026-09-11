/** Server-side source loading is isolated from UI helpers. */
export async function fetchUrlContent(url:string):Promise<string> {
 const {safeFetch}=await import('./safe-fetch');
 const {body,type}=await safeFetch(url);
 if(!['text/html','text/plain','application/xhtml+xml'].includes(type))throw Error('Source must be an article or plain text');
 return body.toString('utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,30000);
}
