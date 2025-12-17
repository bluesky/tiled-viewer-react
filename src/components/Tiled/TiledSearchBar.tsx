import { MagnifyingGlass, CaretDown } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";

type TiledSearchBarProps = {
    // Define any props needed for the TiledSearchBar component
    handleSearchIdClick?: (searchId: string) => void;
    handleSearchMetadataClick?: (metadata: string) => void;
    handleSearchSpecClick?: (spec: string) => void;
};

type SearchType = 'id' | 'metadata' | 'spec';

export default function TiledSearchBar({ handleSearchIdClick, handleSearchMetadataClick, handleSearchSpecClick }: TiledSearchBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [selectedType, setSelectedType] = useState<SearchType | null>(null);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-focus when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
                setShowDropdown(false);
                setShowTypeDropdown(false);
                setSearchInput('');
                setSelectedType(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleIconClick = () => {
        setIsExpanded(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);
        setShowDropdown(value.length > 0);
    };

    const handleOptionClick = (type: SearchType) => {
        setSelectedType(type);
        setShowDropdown(false);
        setShowTypeDropdown(false);
        
        // Execute the appropriate callback
        switch (type) {
            case 'id':
                handleSearchIdClick?.(searchInput);
                break;
            case 'metadata':
                handleSearchMetadataClick?.(searchInput);
                break;
            case 'spec':
                handleSearchSpecClick?.(searchInput);
                break;
        }
    };

    const handleTypeIndicatorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTypeDropdown(!showTypeDropdown);
        setShowDropdown(false);
    };

    const handleTypeChange = (type: SearchType) => {
        setSelectedType(type);
        setShowTypeDropdown(false);
        
        // Execute the appropriate callback with current search input
        if (searchInput) {
            switch (type) {
                case 'id':
                    handleSearchIdClick?.(searchInput);
                    break;
                case 'metadata':
                    handleSearchMetadataClick?.(searchInput);
                    break;
                case 'spec':
                    handleSearchSpecClick?.(searchInput);
                    break;
            }
        }
    };

    const getSelectedTypeDisplay = () => {
        switch (selectedType) {
            case 'id':
                return 'id';
            case 'metadata':
                return 'md';
            case 'spec':
                return 'spec';
            default:
                return null;
        }
    };

    return (
        <div className="relative flex justify-end" ref={containerRef}>
            {/* Main search component */}
            <div 
                className={`
                    flex items-center transition-all duration-200 ease-in-out cursor-pointer origin-right
                    ${isExpanded 
                        ? 'w-64 border border-slate-300 rounded-md px-3 py-4 bg-white' 
                        : 'w-6 h-6'
                    }
                `}
                style={{
                    transformOrigin: 'right center'
                }}
                onClick={!isExpanded ? handleIconClick : undefined}
            >
                {/* Magnifying glass icon - always present and left-justified */}
                <MagnifyingGlass 
                    size={16} 
                    className="text-slate-500 hover:text-slate-700 flex-shrink-0" 
                />
                
                {/* Input field - only visible when expanded */}
                {isExpanded && (
                    <>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchInput}
                            onChange={handleInputChange}
                            className="flex-1 ml-2 outline-none text-sm"
                            placeholder="Search..."
                        />
                        
                        {/* Selected type indicator */}
                        {selectedType && (
                            <div className="relative">
                                <div 
                                    className="flex items-center pl-2 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
                                    onClick={handleTypeIndicatorClick}
                                >
                                    <span>{getSelectedTypeDisplay()}</span>
                                    <CaretDown size={12} className="ml-1" />
                                </div>
                                
                                {/* Type dropdown */}
                                {showTypeDropdown && (
                                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg z-50 min-w-24">
                                        <div 
                                            className="px-3 py-1 hover:bg-slate-50 cursor-pointer text-xs"
                                            onClick={() => handleTypeChange('id')}
                                        >
                                            id
                                        </div>
                                        <div 
                                            className="px-3 py-1 hover:bg-slate-50 cursor-pointer text-xs"
                                            onClick={() => handleTypeChange('metadata')}
                                        >
                                            md
                                        </div>
                                        <div 
                                            className="px-3 py-1 hover:bg-slate-50 cursor-pointer text-xs"
                                            onClick={() => handleTypeChange('spec')}
                                        >
                                            spec
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dropdown options - only visible when typing */}
            {showDropdown && searchInput.length > 0 && (
                <div className="absolute top-full right-0 w-64 mt-1 bg-white border border-slate-300 rounded-md shadow-lg z-50">
                    {/* ID option */}
                    <div 
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                        onClick={() => handleOptionClick('id')}
                    >
                        <div className="text-xs text-slate-400 uppercase tracking-wide">id</div>
                        <div className="text-sm text-slate-700">id is {searchInput}</div>
                    </div>
                    
                    {/* Metadata option */}
                    <div 
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                        onClick={() => handleOptionClick('metadata')}
                    >
                        <div className="text-xs text-slate-400 uppercase tracking-wide">metadata</div>
                        <div className="text-sm text-slate-700">metadata key or value is {searchInput}</div>
                    </div>
                    
                    {/* Spec option */}
                    <div 
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleOptionClick('spec')}
                    >
                        <div className="text-xs text-slate-400 uppercase tracking-wide">spec</div>
                        <div className="text-sm text-slate-700">spec is {searchInput}</div>
                    </div>
                </div>
            )}
        </div>
    );
}