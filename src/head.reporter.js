import Reporter from "../lib/reporter";

const head = new Reporter({ collectorName: "head" });
head.addSchema("head", { contents: "string" });

export default head;