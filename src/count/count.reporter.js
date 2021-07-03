/**
 * A simple counting example for a reporter.
 * It only needs to expose an addListener method to work as expected.
 * Much more complicated examples use Reporters and Collectors; but
 * a reporter only needs the addListener function to work as expected.
 */

let count = 0;
const listeners = [];

const counter = {
    begun: false,
    next() {
        this.listeners.forEach(callback => callback(count));
    },
    addListener(callback) {
        listeners.push(callback);
        if (!this.begun) {
            setInterval(() => {
                count += 1;
                this.next();
            });
            this.begun = true;
        }
    }
}

export default counter;