import { tiledStructureIcons } from "./icons";
import { TiledSearchItem, TiledStructures } from "./types";
import { getDefaultTiledUrl } from "./apiClient";
import { Slider } from "./types";
const defaultTiledUrl = getDefaultTiledUrl();

export const generateLinksForCallback = (item: TiledSearchItem<TiledStructures>, url?:string) => {
    //this function will create a set of links
    //var exampleLink = "http://127.0.0.1:8000/api/v1/metadata/rec20230606_152011_jong-seto_fungal-mycelia_flat-AQ_fungi2_fast/scale3/image";
    var links= {...item.links};
    const baseUrl = url ? url : defaultTiledUrl;
    const path = generateSearchPath(item);
    links.default = baseUrl + '/' + path; //add another link which is the direct path ex)http://127.0.0.1:8000/api/v1/rec20230606_152011_jong-seto_fungal-mycelia_flat-AQ_fungi2_fast/scale3/image
    return links;
}

export const getTiledStructureIcon = (structureFamily:string) => {
    var icon = tiledStructureIcons.question;
    if (structureFamily === 'array' || structureFamily === 'awkward' || structureFamily === 'sparse') {
        icon = tiledStructureIcons.brackestSqaure;
    }
    if (structureFamily === 'table') {
        icon = tiledStructureIcons.table;
    }
    if (structureFamily === 'container') {
        icon = tiledStructureIcons.folder;
    }

    return icon;
};

export const generateSearchPath = (item: TiledSearchItem<TiledStructures>, extra?:string):string => {
    const ancestors = item.attributes.ancestors;
    var searchPath:string = ancestors.length > 0 ? item.attributes.ancestors.join('/') + '/' : '';
    searchPath+=item.id;
    if (extra) {
        searchPath+=extra;
    }
    return searchPath;
};



export const generateFullImagePngPath = (searchPath?:string, stepY?:number, stepX?:number, stack?:number[], url?:string) => {
    const stackString = stack ? stack.join(',') : '';
    const baseUrl = url ? url : defaultTiledUrl;
    return (baseUrl + '/array/full/' + searchPath + '?format=image/png&slice=' + stackString + ',::' + stepY + ',::' + stepX);
};

export const numpyTypeSizesBytes: Record<string, number> = {
    // Numerical Data Types
    b: 1,  // int8
    B: 1,  // uint8
    h: 2,  // int16
    H: 2,  // uint16
    i: 4,  // int32
    I: 4,  // uint32
    l: 8,  // int64
    L: 8,  // uint64
    q: 8,  // int64
    Q: 8,  // uint64
    f: 4,  // float32
    d: 8,  // float64
    g: 16, // float128 (platform-dependent)
  
    // Complex Number Data Types
    F: 8,  // complex64 (2 * float32)
    D: 16, // complex128 (2 * float64)
    G: 32, // complex256 (2 * float128, platform-dependent)
  
    // Character and String Data Types
    S: 1,  // string_ (1 byte per character, fixed length)
    a: 1,  // alias for 'S'
    U: 4,  // unicode_ (4 bytes per character, fixed length)
  
    // Boolean Data Type
    '?': 1, // bool_ (True or False)
  
    // Other Data Types
    O: 8,  // object_ (platform-dependent, typically pointer size)
    M: 8,  // datetime64
    m: 8,  // timedelta64
    V: 1   // void (raw data, size depends on context)
  };

 export const onPopoutClick =(popoutUrl:string) => {
    //open a new tab with the specified URL
    window.open(popoutUrl, '_blank', 'noopener,noreferrer');
};

export const createSliders = (sliderCount:number, shape:number[]) => {
    var initialSliders:Slider[] = [];
    //the first values from shape represent the number of stacks, the last two dims are the actual 'image' size
    for ( let i = 0; i < sliderCount; i++) {
        const newSlider = {
            min: 0,
            max: shape[i]-1,
            index: i,
            value: Math.floor((shape[i]) / 2)
        };
        initialSliders.push(newSlider);
    };
    return initialSliders;
}