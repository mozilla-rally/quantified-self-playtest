import Reporter from "../../lib/reporter";

const page = new Reporter({ collectorName: "page" });

const sharedEventProperties = {
    pageId: "string",
    url: "string",
    title: "string",
    ogTitle: "string",
    ogDescription: "string",
    ogType: "string",
    ogImage: "string",
    ogURL: "string",
    maxScrollHeight: "number", 
    maxPixelScrollDepth: "number",
}

page.addSchema("page", {...sharedEventProperties});

export default page;