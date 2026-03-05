import { ManualTestItemRow, ManualTestCollection, TestItem, TestItemCollection } from "./types";

export const writeTestResultsToLocalStorage = (testResults: ManualTestCollection) => {
    localStorage.setItem('manualTestResults', createTestResultsJSON(testResults));
}

const doesLocalStorageDataMatchTestItems = (testItems: TestItemCollection, storedResults: ManualTestCollection) => {
    const testItemKeys = Object.keys(testItems);
    const storedResultKeys = Object.keys(storedResults);
    
    if (!storedResults || storedResultKeys.length !== testItemKeys.length) {
        return false;
    } else {
        return storedResultKeys.every((key: string) =>
            testItemKeys.includes(key) && testItems[key].name === storedResults[key].name
        );
    }
}

export const initializeTestResults = (testItems: TestItemCollection): ManualTestCollection => {
    //first check if we have existing results in local storage, if so then check if the ids and names match the testItems, if they do then return those results
    const storedResults = localStorage.getItem('manualTestResults');
    if (storedResults) {
        const parsedResults = JSON.parse(storedResults);
        if (doesLocalStorageDataMatchTestItems(testItems, parsedResults)) {
            console.log('Local storage data matches test items, loading stored results');
            // Merge testItems (which have React elements) with stored results (which have isPassing and comment)
            const enrichedResults: ManualTestCollection = Object.keys(testItems).reduce((acc, key) => {
                const item = testItems[key];
                const storedResult = parsedResults[key];
                acc[key] = {
                    ...item, // includes all original properties including the React element
                    isPassing: storedResult?.isPassing || false,
                    comment: storedResult?.comment || ''
                };
                return acc;
            }, {} as ManualTestCollection);
            return enrichedResults;
        }
    }

    //if there is no local storage data or if the ids and names don't match then initialize new results with all tests failing and empty comments
    console.log({testItems})
    const initialResults:ManualTestCollection = {};
    Object.keys(testItems).forEach(key => {
        initialResults[key] = { ...testItems[key], isPassing: false, comment: '' };
    });
    localStorage.setItem('manualTestResults', createTestResultsJSON(initialResults));
    return initialResults;
}

const createTestResultsJSON = (testResults: ManualTestCollection) => {
    //can't convert a react element to JSON so we strip it out here
    const sanitizedResults: Record<string, { name: string; isPassing: boolean; comment?: string }> = {};
    Object.keys(testResults).forEach(key => {
        const { name, isPassing, comment } = testResults[key];
        sanitizedResults[key] = {
            name,
            isPassing,
            comment
        };
    });
    return JSON.stringify(sanitizedResults);
}
