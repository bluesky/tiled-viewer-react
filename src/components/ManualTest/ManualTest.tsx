import { useState, useEffect, useMemo } from "react";

import { TestItemCollection, ManualTestItemRow, ManualTestCollection } from "./types";
import { initializeTestResults, writeTestResultsToLocalStorage } from "./utils";
import { resetGlobalState } from "../Tiled/apiClient";

export type ManualTestProps = {
    testItems: TestItemCollection;
}
export default function ManualTest({ testItems }: ManualTestProps) {
    const initializedTestResults = useMemo(() => initializeTestResults(testItems), [testItems]);
    const [ testResults, setTestResults] = useState<ManualTestCollection>(initializedTestResults);
    const [ copyButtonText, setCopyButtonText ] = useState<string>('Copy Table');
    const [ commandCopyStates, setCommandCopyStates ] = useState<Record<string, string>>({});
    const [ currentTestIndex, setCurrentTestIndex ] = useState<number>(0);
    
    const testKeys = Object.keys(testItems);
    const currentTestKey = testKeys[currentTestIndex];
    const currentTest = currentTestKey ? testResults[currentTestKey] : null;

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>, id: string, comment: string) => {
        e.preventDefault();
        setTestResults(prevResults => {
            const updatedResults = { ...prevResults };
            if (updatedResults[id]) {
                updatedResults[id] = { ...updatedResults[id], comment };
            }
            writeTestResultsToLocalStorage(updatedResults);
            return updatedResults;
        });
    }

    const handleStatusToggle = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.preventDefault();
        setTestResults(prevResults => {
            const updatedResults = { ...prevResults };
            if (updatedResults[id]) {
                updatedResults[id] = { ...updatedResults[id], isPassing: !updatedResults[id].isPassing };
            }
            writeTestResultsToLocalStorage(updatedResults);
            return updatedResults;
        });
    }

    const resetTestResults = () => {
        const blankTestResults: ManualTestCollection = {};
        Object.keys(testItems).forEach(key => {
            blankTestResults[key] = { ...testItems[key], isPassing: false, comment: '' };
        });
        setTestResults(blankTestResults);
        writeTestResultsToLocalStorage(blankTestResults);
    };

    const handleCopyTableToMarkdown = () => {
        const header = '| ID | Name | Status | Comment |\n| --- | --- | --- | --- |\n';
        const rows = Object.keys(testResults).map(key => {
            const result = testResults[key];
            const status = result.isPassing ? '✓' : '✗';
            return `| ${key} | ${result.name} | ${status} | ${result.comment || ''} |`;
        }).join('\n');
        const markdownTable = header + rows;
        navigator.clipboard.writeText(markdownTable)
            .then(() => {
                setCopyButtonText('Copied');
                setTimeout(() => {
                    setCopyButtonText('Copy Table');
                }, 1000);
            })
            .catch(err => alert('Failed to copy test results: ' + err));
    }   

    const handleCopyCommand = (key: string, command: string) => {
        navigator.clipboard.writeText(command)
            .then(() => {
                setCommandCopyStates(prev => ({ ...prev, [key]: 'Copied' }));
                setTimeout(() => {
                    setCommandCopyStates(prev => ({ ...prev, [key]: 'Copy' }));
                }, 1000);
            })
            .catch(err => alert('Failed to copy command: ' + err));
    }

    const handleTestChange = (newIndex: number) => {
        // Reset API client global state before switching tests
        resetGlobalState();
        setCurrentTestIndex(newIndex);
        //clear the tiled_csrf cookie to prevent auth issues when switching between tests that require different authentication states
        document.cookie = 'tiled_csrf=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    const nextTest = () => {
        if (currentTestIndex < testKeys.length - 1) {
            handleTestChange(currentTestIndex + 1);
        }
    }

    const prevTest = () => {
        if (currentTestIndex > 0) {
            handleTestChange(currentTestIndex - 1);
        }
    }

    // Reset globals when component mounts or test items change
    useEffect(() => {
        resetGlobalState();
    }, [testItems]);   



    return (
        <div className="p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Manual Test Page</h1>
            <p>This page is for manually testing the Tiled component and related features.</p>
            <p>Use this space to render the Tiled component in various configurations, test authentication flows, and debug any issues that arise during development.</p>
            {/* A summary table that shows the test results, including id, name, passing status, and optional comment */}
            <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                    <tr>
                        <th className="border border-gray-200 p-2 w-1/12">ID</th>
                        <th className="border border-gray-200 p-2 w-1/6">Name</th>
                        <th className="border border-gray-200 p-2 w-1/12">Status</th>
                        <th className="border border-gray-200 p-2 w-1/2">Comment</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(testResults).map(key => {
                        const result = testResults[key];
                        return (
                            <tr key={key}>
                                <td className="border border-gray-200 p-2">{key}</td>
                                <td className="border border-gray-200 p-2">{result.name}</td>
                                <td className="border border-gray-200 p-2 text-center">
                                    {result.isPassing ? (
                                        <span className="text-green-500 text-xl">✓</span>
                                    ) : (
                                        <span className="text-red-500 text-xl">✗</span>
                                    )}
                                </td> 
                                <td className="border border-gray-200 p-2">{result.comment}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Copy to Markdown button */}
            <div className="mt-4">
                <button
                    onClick={handleCopyTableToMarkdown}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    {copyButtonText}
                </button>
            </div>

            {/* Test Carousel Navigation */}
            <div className="mt-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Test Carousel</h2>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={prevTest}
                            disabled={currentTestIndex === 0}
                            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            {currentTestIndex + 1} of {testKeys.length}
                        </span>
                        <button
                            onClick={nextTest}
                            disabled={currentTestIndex === testKeys.length - 1}
                            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {/* Test Selection Tabs */}
                <div className="flex space-x-2 mb-6 overflow-x-auto">
                    {testKeys.map((key, index) => (
                        <button
                            key={key}
                            onClick={() => handleTestChange(index)}
                            className={`px-4 py-2 rounded whitespace-nowrap transition-colors ${
                                index === currentTestIndex
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {key}: {testResults[key]?.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Test Display */}
            {currentTest && (
                <div className="border border-gray-200 rounded p-6 mt-4" key={currentTest.name}>
                    <div className="mb-4">
                        <h2 className="text-2xl font-semibold mb-2">{currentTest.name}</h2>
                        <div className="text-sm text-gray-600 mb-2">Test ID: <span className="font-mono">{currentTestKey}</span></div>
                        
                        {/* Display info if available */}
                        {currentTest.info && (
                            <div className="mb-4">
                                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{currentTest.info}</p>
                            </div>
                        )}
                        
                        {/* Display command with copy button if available */}
                        {currentTest.command && (
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium">Tiled Startup Command:</label>
                                <div className="flex items-center space-x-2">
                                    <code className="flex-1 bg-gray-100 border border-gray-300 rounded p-3 text-sm font-mono overflow-x-auto">
                                        {currentTest.command}
                                    </code>
                                    <button
                                        onClick={() => handleCopyCommand(currentTestKey, currentTest.command!)}
                                        className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
                                    >
                                        {commandCopyStates[currentTestKey] || 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Test Controls */}
                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">Status:</span>
                                <span className="text-sm">Passing</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={!currentTest.isPassing}
                                        onChange={(e) => handleStatusToggle(e, currentTestKey)}
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${currentTest.isPassing ? 'bg-green-500' : 'bg-red-500'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${currentTest.isPassing ? 'translate-x-0' : 'translate-x-5'} mt-0.5 ml-0.5`}></div>
                                    </div>
                                </label>
                                <span className="text-sm">Failing</span>
                            </div>
                        </div>
                    </div>

                    {/* Comment Section */}
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium">Test Comments:</label>
                        <textarea 
                            className="w-full h-24 resize-none border border-gray-300 rounded p-3 align-top"
                            value={currentTest.comment || ''}
                            onChange={(e) => handleCommentChange(e, currentTestKey, e.target.value)}
                            placeholder="Enter your test comments here..."
                        />
                    </div>

                    {/* Tiled Component */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Tiled Component:</h3>
                        <div className="bg-white border border-gray-300 rounded p-4">
                            {currentTest.element}
                        </div>
                    </div>
                </div>
            )}

            {/* Render each test item element below the item's id and name. An input box will write to the testResults state comment for that item. A toggle switch changes the isPassing state for that item. */}
        </div>
    )
}