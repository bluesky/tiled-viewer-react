export type PathItem = {
    id: string;
    structure: string;
};

export type Breadcrumb = {
    label: string;
    labelStyle?: string;
    icon?: JSX.Element;
    iconStyle?: string;
    onClick?: Function;
}
export type Slider = {
    min: number;
    max: number;
    index: number;
    value: number;
};


export type Paths = PathItem[];

// Example of a predefined paths array
export const pathsSample: Paths = [
    { id: 'structured_data', structure: "container" },
    { id: 'big_image', structure: "array" },
];

export interface TiledSearchResult {
    data: TiledSearchItem<TiledStructures>[]; // An array of search items
    error: string | null; // Error message, if any
    links: {
        self: string;
        first: string;
        last: string;
        next: string | null;
        prev: string | null;
    };
    meta: {
        count: number;
    };
}

export interface TiledItemLinks {
        self: string;
        full?: string;
        block?: string;
        buffers?: string;
        partition?: string;
        search?: string;
        default?: string;
}

// Definition for a single search item
export interface TiledSearchItem<StructureType> {
    id: string; // Identifier for the item
    attributes: {
        ancestors: string[]; // Array of ancestor IDs
        structure_family: "array" | "table" | "container" | "awkward" | "sparse" | "composite"; // Enum for structure families
        specs: Spec[]; // Optional specs
        metadata: Record<string, unknown>; // Metadata as a dictionary
        structure: StructureType;
        sorting: Sorting[] | null; // Sorting details, if applicable
        data_sources: string | null; // Data source, if any
    };
    links: TiledItemLinks; // Links related to the item
    meta: unknown | null; // Optional metadata
}


export type TiledStructures = ArrayStructure | StructuredArrayStructure | TableStructure | ContainerStructure | AwkwardStructure | SparseStructure

// Specs type
export interface Spec {
    name: string;
    version: string | null;
}

// Sorting details
export interface Sorting {
    key: string;
    direction: number;
}

// Structure definitions for the `structure` key
export interface ArrayStructure {
    data_type: {
        endianness: string;
        kind: string;
        itemsize: number;
        dt_units: string | null;
    };
    chunks: number[][];
    shape: number[];
    dims: string[] | null;
    resizable: boolean;
}

export interface StructuredArrayStructure {
    data_type: {
        itemsize: number;
        fields: StructuredArrayField[];
    };
    chunks: number[][];
    shape: number[];
    dims: string[] | null;
    resizable: boolean;
}

export interface StructuredArrayField {
    name: string;
    dtype: {
        endianness: string;
        kind: string;
        itemsize: number;
        dt_units: string | null;
    };
    shape: number[] | null;
}


export interface TableStructure {
    arrow_schema: string;
    npartitions: number;
    columns: string[];
    resizable: boolean;
}

export interface ContainerStructure {
    contents: unknown | null;
    count: number;
}

export interface AwkwardStructure {
    length: number;
    form: AwkwardForm;
}

export interface AwkwardForm {
    class: string;
    offsets?: string;
    primitive?: string;
    inner_shape?: number[];
    parameters: Record<string, unknown>;
    form_key: string;
    content?: AwkwardForm;
    fields?: string[];
    contents?: AwkwardForm[];
}

export interface SparseStructure {
    layout: string;
    shape: number[];
    chunks: number[][];
    dims: string[] | null;
    resizable: boolean;
}

export type PreviewSize = 'hidden' | 'small' | 'medium' | 'large';

export interface TiledTableRow {
    [column: string]: number
}

export interface TiledStructuredArrayRow extends Array<string | number> {}

export type TiledTableData = TiledTableRow[];

export type TiledStructuredArrayData = TiledStructuredArrayRow[];

export const isArrayStructure = (item: TiledSearchItem<any>): item is TiledSearchItem<ArrayStructure> => {
    return item.attributes.structure_family === 'array';
};

export const isTableStructure = (item: TiledSearchItem<any>): item is TiledSearchItem<TableStructure> => {
    return item.attributes.structure_family === 'table';
};

export const isContainerStructure = (item: TiledSearchItem<any>): item is TiledSearchItem<ContainerStructure> => {
    return (item.attributes.structure_family === 'container' || item.attributes.structure_family === 'composite');
};

export const isAwkwardStructure = (item: TiledSearchItem<any>): item is TiledSearchItem<AwkwardStructure> => {
    return item.attributes.structure_family === 'awkward';
};

export const isSparseStructure = (item: TiledSearchItem<any>): item is TiledSearchItem<SparseStructure> => {
    return item.attributes.structure_family === 'sparse';
};

export const isStructuredArrayStructure = (item: TiledSearchItem<any>): item is TiledSearchItem<StructuredArrayStructure> => {
    return item.attributes.structure_family === 'array' && 
           'fields' in item.attributes.structure.data_type;
};