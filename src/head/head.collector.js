import Collector from "../../lib/collector";

const head = new Collector();

head.on('attention-start', (collector) => {
    const state = collector.get();
    const headerContents = document.getElementsByTagName('head')[0];
    if (!state.hasSentThis && headerContents && headerContents.innerHTML) {
        collector.send('head', { contents: headerContents.innerHTML });
        collector.updateState(state => { state.hasSentThis = true; });
    }
})

head.run();
