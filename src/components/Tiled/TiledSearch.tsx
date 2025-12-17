import React, { useState } from 'react';
import { getSearchResults } from './apiClient';
import { TiledSearchConfig, TiledSearchFilters, TiledSearchOptions } from './apiTypes';

interface SearchFormData {
    // Basic config
    baseUrl: string;
    path: string;
    initialPath: string;
    apiKey: string;
    
    // Search options
    fields: string;
    selectMetadata: string;
    pageOffset: string;
    pageLimit: string;
    sort: string;
    maxDepth: string;
    omitLinks: boolean;
    includeDataSources: boolean;
    
    // Filters
    fulltextText: string;
    lookupKey: string;
    keysFilterKeys: string;
    regexKey: string;
    regexPattern: string;
    regexCaseSensitive: boolean;
    eqKey: string;
    eqValue: string;
    noteqKey: string;
    noteqValue: string;
    comparisonOperator: 'gt' | 'gte' | 'lt' | 'lte' | '';
    comparisonKey: string;
    comparisonValue: string;
    containsKey: string;
    containsValue: string;
    inKey: string;
    inValue: string;
    notinKey: string;
    notinValue: string;
    keyPresentKey: string;
    keyPresentExists: boolean;
    likeKey: string;
    likePattern: string;
    specsInclude: string;
    specsExclude: string;
    accessBlobUserId: string;
    accessBlobTags: string;
    structureFamilyValue: 'container' | 'array' | 'table' | 'awkward' | 'sparse' | '';
}

export default function TiledSearch() {
    const [formData, setFormData] = useState<SearchFormData>({
        // Basic config
        baseUrl: 'https://your-tiled-server.com',
        path: '',
        initialPath: '',
        apiKey: '',
        
        // Search options
        fields: '',
        selectMetadata: '',
        pageOffset: '',
        pageLimit: '',
        sort: '',
        maxDepth: '',
        omitLinks: false,
        includeDataSources: false,
        
        // Filters
        fulltextText: '',
        lookupKey: '',
        keysFilterKeys: '',
        regexKey: '',
        regexPattern: '',
        regexCaseSensitive: false,
        eqKey: '',
        eqValue: '',
        noteqKey: '',
        noteqValue: '',
        comparisonOperator: '',
        comparisonKey: '',
        comparisonValue: '',
        containsKey: '',
        containsValue: '',
        inKey: '',
        inValue: '',
        notinKey: '',
        notinValue: '',
        keyPresentKey: '',
        keyPresentExists: false,
        likeKey: '',
        likePattern: '',
        specsInclude: '',
        specsExclude: '',
        accessBlobUserId: '',
        accessBlobTags: '',
        structureFamilyValue: '',
    });

    const [searchResults, setSearchResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleInputChange = (field: keyof SearchFormData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const buildSearchConfig = (): TiledSearchConfig => {
        const config: TiledSearchConfig = {
            baseUrl: formData.baseUrl,
        };

        if (formData.path) config.path = formData.path;
        if (formData.initialPath) config.initialPath = formData.initialPath;
        if (formData.apiKey) config.apiKey = formData.apiKey;

        // Build options
        const options: TiledSearchOptions = {};
        if (formData.fields) options.fields = formData.fields.split(',').map(f => f.trim());
        if (formData.selectMetadata) options.selectMetadata = formData.selectMetadata;
        if (formData.pageOffset) options.pageOffset = parseInt(formData.pageOffset);
        if (formData.pageLimit) options.pageLimit = parseInt(formData.pageLimit);
        if (formData.sort) options.sort = formData.sort;
        if (formData.maxDepth) options.maxDepth = parseInt(formData.maxDepth);
        if (formData.omitLinks) options.omitLinks = formData.omitLinks;
        if (formData.includeDataSources) options.includeDataSources = formData.includeDataSources;
        
        if (Object.keys(options).length > 0) config.options = options;

        // Build filters
        const filters: TiledSearchFilters = {};
        if (formData.fulltextText) filters.fulltext = { text: formData.fulltextText };
        if (formData.lookupKey) filters.lookup = { key: formData.lookupKey };
        if (formData.keysFilterKeys) filters.keysFilter = { keys: formData.keysFilterKeys.split(',').map(k => k.trim()) };
        if (formData.regexKey && formData.regexPattern) {
            filters.regex = { 
                key: formData.regexKey, 
                pattern: formData.regexPattern,
                caseSensitive: formData.regexCaseSensitive 
            };
        }
        if (formData.eqKey && formData.eqValue) filters.eq = { key: formData.eqKey, value: formData.eqValue };
        if (formData.noteqKey && formData.noteqValue) filters.noteq = { key: formData.noteqKey, value: formData.noteqValue };
        if (formData.comparisonOperator && formData.comparisonKey && formData.comparisonValue) {
            filters.comparison = { 
                operator: formData.comparisonOperator as 'gt' | 'gte' | 'lt' | 'lte', 
                key: formData.comparisonKey, 
                value: formData.comparisonValue 
            };
        }
        if (formData.containsKey && formData.containsValue) filters.contains = { key: formData.containsKey, value: formData.containsValue };
        if (formData.inKey && formData.inValue) {
            filters.in = { key: formData.inKey, value: formData.inValue.split(',').map(v => v.trim()) };
        }
        if (formData.notinKey && formData.notinValue) {
            filters.notin = { key: formData.notinKey, value: formData.notinValue.split(',').map(v => v.trim()) };
        }
        if (formData.keyPresentKey) filters.keyPresent = { key: formData.keyPresentKey, exists: formData.keyPresentExists };
        if (formData.likeKey && formData.likePattern) filters.like = { key: formData.likeKey, pattern: formData.likePattern };
        if (formData.specsInclude || formData.specsExclude) {
            filters.specs = { 
                include: formData.specsInclude ? formData.specsInclude.split(',').map(s => s.trim()) : [], 
                exclude: formData.specsExclude ? formData.specsExclude.split(',').map(s => s.trim()) : [] 
            };
        }
        if (formData.accessBlobUserId || formData.accessBlobTags) {
            filters.accessBlob = {
                ...(formData.accessBlobUserId && { userId: formData.accessBlobUserId }),
                ...(formData.accessBlobTags && { tags: formData.accessBlobTags.split(',').map(t => t.trim()) })
            };
        }
        if (formData.structureFamilyValue) {
            filters.structureFamily = { value: formData.structureFamilyValue as 'container' | 'array' | 'table' | 'awkward' | 'sparse' };
        }

        if (Object.keys(filters).length > 0) config.filters = filters;

        return config;
    };

    const handleSearch = async () => {
        setLoading(true);
        setError('');
        setSearchResults(null);

        try {
            const config = buildSearchConfig();
            console.log('Search config:', config);
            const results = await getSearchResults(config);
            setSearchResults(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Tiled Search Component</h1>
            
            <div className="space-y-6">
                {/* Basic Configuration */}
                <section className="border p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">Basic Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Base URL *</label>
                            <input
                                type="text"
                                value={formData.baseUrl}
                                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="https://your-tiled-server.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Path</label>
                            <input
                                type="text"
                                value={formData.path}
                                onChange={(e) => handleInputChange('path', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="optional/path"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Initial Path</label>
                            <input
                                type="text"
                                value={formData.initialPath}
                                onChange={(e) => handleInputChange('initialPath', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="beamline531"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">API Key</label>
                            <input
                                type="password"
                                value={formData.apiKey}
                                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="your-api-key"
                            />
                        </div>
                    </div>
                </section>

                {/* Search Options */}
                <section className="border p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">Search Options</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Fields (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.fields}
                                onChange={(e) => handleInputChange('fields', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="id,metadata,structure_family"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Select Metadata</label>
                            <input
                                type="text"
                                value={formData.selectMetadata}
                                onChange={(e) => handleInputChange('selectMetadata', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="metadata.plan_name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Page Offset</label>
                            <input
                                type="number"
                                value={formData.pageOffset}
                                onChange={(e) => handleInputChange('pageOffset', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Page Limit</label>
                            <input
                                type="number"
                                value={formData.pageLimit}
                                onChange={(e) => handleInputChange('pageLimit', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="25"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Sort</label>
                            <input
                                type="text"
                                value={formData.sort}
                                onChange={(e) => handleInputChange('sort', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="created_time or -created_time"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Max Depth</label>
                            <input
                                type="number"
                                value={formData.maxDepth}
                                onChange={(e) => handleInputChange('maxDepth', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="5"
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.omitLinks}
                                    onChange={(e) => handleInputChange('omitLinks', e.target.checked)}
                                    className="mr-2"
                                />
                                Omit Links
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.includeDataSources}
                                    onChange={(e) => handleInputChange('includeDataSources', e.target.checked)}
                                    className="mr-2"
                                />
                                Include Data Sources
                            </label>
                        </div>
                    </div>
                </section>

                {/* Search Filters */}
                <section className="border p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">Search Filters</h2>
                    
                    {/* Text-based filters */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Text Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Fulltext Search</label>
                                <input
                                    type="text"
                                    value={formData.fulltextText}
                                    onChange={(e) => handleInputChange('fulltextText', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="search text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Lookup Key</label>
                                <input
                                    type="text"
                                    value={formData.lookupKey}
                                    onChange={(e) => handleInputChange('lookupKey', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="metadata.plan_name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Keys Filter (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.keysFilterKeys}
                                    onChange={(e) => handleInputChange('keysFilterKeys', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="key1,key2,key3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Regex filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Regex Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Regex Key</label>
                                <input
                                    type="text"
                                    value={formData.regexKey}
                                    onChange={(e) => handleInputChange('regexKey', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="sample_name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Regex Pattern</label>
                                <input
                                    type="text"
                                    value={formData.regexPattern}
                                    onChange={(e) => handleInputChange('regexPattern', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="^test_.*"
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.regexCaseSensitive}
                                        onChange={(e) => handleInputChange('regexCaseSensitive', e.target.checked)}
                                        className="mr-2"
                                    />
                                    Case Sensitive
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Equality filters */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Equality Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border p-3 rounded">
                                <h4 className="text-sm font-medium mb-2">Equal To</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={formData.eqKey}
                                        onChange={(e) => handleInputChange('eqKey', e.target.value)}
                                        className="px-3 py-2 border rounded-md"
                                        placeholder="key"
                                    />
                                    <input
                                        type="text"
                                        value={formData.eqValue}
                                        onChange={(e) => handleInputChange('eqValue', e.target.value)}
                                        className="px-3 py-2 border rounded-md"
                                        placeholder="value"
                                    />
                                </div>
                            </div>
                            <div className="border p-3 rounded">
                                <h4 className="text-sm font-medium mb-2">Not Equal To</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={formData.noteqKey}
                                        onChange={(e) => handleInputChange('noteqKey', e.target.value)}
                                        className="px-3 py-2 border rounded-md"
                                        placeholder="key"
                                    />
                                    <input
                                        type="text"
                                        value={formData.noteqValue}
                                        onChange={(e) => handleInputChange('noteqValue', e.target.value)}
                                        className="px-3 py-2 border rounded-md"
                                        placeholder="value"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Comparison Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Operator</label>
                                <select
                                    value={formData.comparisonOperator}
                                    onChange={(e) => handleInputChange('comparisonOperator', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    <option value="">Select operator</option>
                                    <option value="gt">Greater than (gt)</option>
                                    <option value="gte">Greater than or equal (gte)</option>
                                    <option value="lt">Less than (lt)</option>
                                    <option value="lte">Less than or equal (lte)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Key</label>
                                <input
                                    type="text"
                                    value={formData.comparisonKey}
                                    onChange={(e) => handleInputChange('comparisonKey', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="num_points"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Value</label>
                                <input
                                    type="text"
                                    value={formData.comparisonValue}
                                    onChange={(e) => handleInputChange('comparisonValue', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contains filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Contains Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Key</label>
                                <input
                                    type="text"
                                    value={formData.containsKey}
                                    onChange={(e) => handleInputChange('containsKey', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="tags"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Value</label>
                                <input
                                    type="text"
                                    value={formData.containsValue}
                                    onChange={(e) => handleInputChange('containsValue', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="experiment"
                                />
                            </div>
                        </div>
                    </div>

                    {/* In/Not In filters */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">In/Not In Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border p-3 rounded">
                                <h4 className="text-sm font-medium mb-2">In</h4>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={formData.inKey}
                                        onChange={(e) => handleInputChange('inKey', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="key"
                                    />
                                    <input
                                        type="text"
                                        value={formData.inValue}
                                        onChange={(e) => handleInputChange('inValue', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="value1,value2,value3"
                                    />
                                </div>
                            </div>
                            <div className="border p-3 rounded">
                                <h4 className="text-sm font-medium mb-2">Not In</h4>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={formData.notinKey}
                                        onChange={(e) => handleInputChange('notinKey', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="key"
                                    />
                                    <input
                                        type="text"
                                        value={formData.notinValue}
                                        onChange={(e) => handleInputChange('notinValue', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="value1,value2,value3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Present filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Key Present Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Key</label>
                                <input
                                    type="text"
                                    value={formData.keyPresentKey}
                                    onChange={(e) => handleInputChange('keyPresentKey', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="metadata.scan_id"
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.keyPresentExists}
                                        onChange={(e) => handleInputChange('keyPresentExists', e.target.checked)}
                                        className="mr-2"
                                    />
                                    Key Must Exist
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Like filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Like Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Key</label>
                                <input
                                    type="text"
                                    value={formData.likeKey}
                                    onChange={(e) => handleInputChange('likeKey', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="sample_name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Pattern</label>
                                <input
                                    type="text"
                                    value={formData.likePattern}
                                    onChange={(e) => handleInputChange('likePattern', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="%test%"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Specs filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Specs Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Include Specs (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.specsInclude}
                                    onChange={(e) => handleInputChange('specsInclude', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="BlueskyRun,BlueskyEventStream"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Exclude Specs (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.specsExclude}
                                    onChange={(e) => handleInputChange('specsExclude', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="OldSpec,DeprecatedSpec"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Access Blob filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Access Blob Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">User ID</label>
                                <input
                                    type="text"
                                    value={formData.accessBlobUserId}
                                    onChange={(e) => handleInputChange('accessBlobUserId', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="user123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.accessBlobTags}
                                    onChange={(e) => handleInputChange('accessBlobTags', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="public,experiment"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Structure Family filter */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Structure Family Filter</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Structure Family</label>
                            <select
                                value={formData.structureFamilyValue}
                                onChange={(e) => handleInputChange('structureFamilyValue', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="">Select structure family</option>
                                <option value="container">Container</option>
                                <option value="array">Array</option>
                                <option value="table">Table</option>
                                <option value="awkward">Awkward</option>
                                <option value="sparse">Sparse</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Searching...' : 'Search Tiled'}
                </button>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Results Display */}
                {searchResults && (
                    <section className="border p-4 rounded-lg">
                        <h2 className="text-lg font-semibold mb-4">Search Results</h2>
                        <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                            <pre className="text-sm">{JSON.stringify(searchResults, null, 2)}</pre>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}