import { useState, useEffect } from "react";

import { TestItemCollection, ManualTestItemRow, ManualTestCollection } from "./types";
import { initializeTestResults, writeTestResultsToLocalStorage } from "./utils";

export type ManualTestProps = {
    testItems: TestItemCollection;
}
export default function ManualTest({ testItems }: ManualTestProps) {
    const [ testResults, setTestResults] = useState<ManualTestCollection>(initializeTestResults(testItems));

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>, id: string, comment: string) => {
        e.preventDefault();
        setTestResults(prevResults => {
            const updatedResults = { ...prevResults };
            if (updatedResults[id]) {
                updatedResults[id] = { ...updatedResults[id], comment };
            }
            writeTestResultsToLocalStorage(Object.values(updatedResults));
            return updatedResults;
        });
    }

    const handleStatusToggle = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.preventDefault();
        setTestResults(prevResults => {
            const updatedResults = { ...prevResults };
            if (updatedResults[id]) {
                updatedResults[id] = { ...updatedResults[id], isPassing: !updatedResults[id].isPassing };
            }
            writeTestResultsToLocalStorage(Object.values(updatedResults));
            return updatedResults;
        });
    }

    const resetTestResults = () => {
        const blankTestResults: ManualTestCollection = {};
        Object.keys(testItems).forEach(key => {
            blankTestResults[key] = { ...testItems[key], isPassing: false, comment: '' };
        });
        setTestResults(blankTestResults);
        writeTestResultsToLocalStorage(Object.values(blankTestResults));
    }



    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Manual Test Page</h1>
            <p>This page is for manually testing the Tiled component and related features.</p>
            <p>Use this space to render the Tiled component in various configurations, test authentication flows, and debug any issues that arise during development.</p>
            {/* A summary table that shows the test results, including id, name, passing status, and optional comment */}
            <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                    <tr>
                        <th className="border border-gray-200 p-2">ID</th>
                        <th className="border border-gray-200 p-2">Name</th>
                        <th className="border border-gray-200 p-2">Status</th>
                        <th className="border border-gray-200 p-2">Comment</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(testResults).map(key => {
                        const result = testResults[key];
                        return (
                            <tr key={key}>
                                <td className="border border-gray-200 p-2">{key}</td>
                                <td className="border border-gray-200 p-2">{result.name}</td>
                                <td className="border border-gray-200 p-2">{result.isPassing ? 'Passing' : 'Failing'}</td> 
                                <td className="border border-gray-200 p-2">{result.comment}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Render each test item element below the item's id and name. An input box will write to the testResults state comment for that item. A toggle switch changes the isPassing state for that item. */}
            <section>
                {Object.keys(testResults).map(key => {
                    const result = testResults[key];
                    return (
                        <div key={key} className="border border-gray-200 rounded p-4 mt-4">
                            <h2 className="text-xl font-semibold mb-2">{result.name}</h2>
                            <div className="mb-2">
                                <label className="mr-2">Status:</label>
                                <button 
                                    className={`px-4 py-2 rounded ${result.isPassing ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                    onClick={(e) => handleStatusToggle(e, key)}
                                >
                                    {result.isPassing ? 'Passing' : 'Failing'}
                                </button>
                            </div>
                            <div>
                                <label className="block mb-1">Comment:</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={result.comment}
                                    onChange={(e) => handleCommentChange(e, key, e.target.value)}
                                />
                            </div>
                            {/* Render the test item element for this test result */}
                            <div className="mt-4">
                                {result.element}
                            </div>
                        </div>
                    );
                })}
            </section>
        </div>
    )
}