
## collection and reporting

### Design goals
- data collection functions should be mostly functional, only closing over `document` and `window` to the extent that these are needed. This mostly-functional approach makes your data collection much cleaner, easier to test, and easier to reuse.
- the collectors should not be too big. Right now, the biggest contribution to them is immer's `produce` function, which adds 15kb per collection effort. This is both not very big but probably avoidable if we were to handle immer differently than we are right now.
- indexeddb might be a good solution, so let's try that.