import * as PageManager from "../WebScience/Utilities/PageManager.js";
import * as Messaging from "../WebScience/Utilities/Messaging.js";
import * as Events from "../WebScience/Utilities/Events.js";

export default class Reporter {
    constructor({ schema, namespace, matchPatterns = ['<all_urls>'] }) {
        this.namespace = namespace;
        this.matchPatterns = matchPatterns;
        this.schema = schema;
        this.notifyAboutPrivateWindows = false;
        this.onPageData = new Events.Event({
            addListenerCallback: this._addListener.bind(this),
            removeListenerCallback: this._removeListener.bind(this)});
    }

    _addListener(listener, options) {
        this._startMeasurement(options);
    }

    _removeListener(listener) {
        // if (!this.hasAnyListeners()) {
            this._stopMeasurement();
        // }
    }

    _pageDataListener(pageData) {
        // If the page is in a private window and the module should not measure private windows,
        // ignore the page
        if(!(this.notifyAboutPrivateWindows) && pageData.privateWindow) {
            return;
        }
    
        // Delete the type string from the content script message
        delete pageData.type;
    
        this.onPageData.notifyListeners([ pageData ]);
    }

    async _startMeasurement(matchPatterns = ['<all_urls>']) {
        await PageManager.initialize();
        console.log('page manager started.')
        
        this.registeredContentScript = await browser.contentScripts.register({
            matches: this.matchPatterns,
            js: [{
                file: `/dist/content-scripts/${this.namespace}.collector.js`
            }],
            runAt: "document_start"
        });
        Messaging.registerListener(this.namespace, this._pageDataListener, this.schema);
    }

    async _stopMeasurement() {
        Messaging.unregisterListener(this.namespace, this._pageDataListener);    
        this.registeredContentScript.unregister();
        this.registeredContentScript = null;
        this.notifyAboutPrivateWindows = false;
    }

    addListener(callback, options) {
        this.onPageData.addListener(callback, options);
    }
}