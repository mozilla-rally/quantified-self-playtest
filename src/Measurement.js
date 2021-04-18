import Reporter from "./Reporter";
import Collector from "./Collector";

export default class Measurement {
    constructor({ namespace, schema }) {
        this.reporter = new Reporter({ namespace, schema });
        this.collector = new Collector({ namespace });
        this.schema = schema;
        this.namespace = namespace;
    }

    start() {}
    stop() {}
}