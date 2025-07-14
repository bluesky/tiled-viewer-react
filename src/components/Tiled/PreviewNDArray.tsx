import { useState, useEffect, useCallback } from "react";
import InputSlider from "../InputSlider";
import { TiledSearchItem, ArrayStructure, Slider } from "./types";
import { generateSearchPath, generateFullImagePngPath, numpyTypeSizesBytes, onPopoutClick, createSliders  } from './utils';
import {  } from "./apiClient";
import { tailwindIcons } from "@/assets/icons";


type PreviewNDArrayProps = {
    arrayItem: TiledSearchItem<ArrayStructure>;
    url?: string;
    isFullWidth?: boolean;
};    

export default function PreviewNDArray({
    arrayItem,
    url,
    isFullWidth,
}: PreviewNDArrayProps) {
    const [ sliders, setSliders ] = useState<Slider[]>([]);
    const [ imageUrl, setImageUrl ] = useState('');
    const [ popoutUrl, setPopoutUrl ] = useState('');

    const maxBytesAllowed = 1000000;
    const shape = arrayItem.attributes.structure.shape;
    const dims = shape.length;
    const sliderCount = dims - 2; //2D array is an image, no slider needed, 3D array needs a single slider, etc.
    

    const handleSliderChange = (newValue:number, slider:Slider) => {
        //make an API call to overwrite the current image

        var stack = sliders.map((slider) => slider.value);
        stack[slider.index] = newValue;
        updateImage(stack);
        setSliders((prevState) => {
            var newState = [...prevState];
            newState[slider.index].value = newValue;
            return newState;
        })
    }

    const searchPath = generateSearchPath(arrayItem);

    const updateImage = (stack?:number[]) => {
        var stepX = 1;
        var stepY = 1;
        const letter = arrayItem.attributes.structure.data_type.kind[0] as keyof typeof numpyTypeSizesBytes;
        const bytesPerElement = numpyTypeSizesBytes[letter];
        const totalImageSizeBytes = shape[shape.length-1] * shape[shape.length-2] * bytesPerElement; //last two index are always the frame data to be displayed
        if (totalImageSizeBytes > maxBytesAllowed) {
            const ratio = totalImageSizeBytes / maxBytesAllowed;
            let squareStep = Math.ceil(Math.sqrt(ratio));
            //TO DO - downsamplke for rectangular images instead of assumed square
            stepX = squareStep;
            stepY = squareStep;
        }
        const reducedImagePath = generateFullImagePngPath(searchPath, stepY, stepX, stack, url);
        setImageUrl(reducedImagePath); 
        const fullSizeImagePath = generateFullImagePngPath(searchPath, 1, 1, stack, url);
        setPopoutUrl(fullSizeImagePath); 
    }

    useEffect(() => {
        //make an api call to fill the image
        if (!arrayItem) return;

        const stack = shape.slice(0, sliderCount).map((dim) => Math.floor(dim/2));
        setSliders(createSliders(sliderCount, shape));
        updateImage(stack);
    }, [arrayItem]);

    return (
        <div className="flex flex-col w-full space-y-2">
            <p className="text-sky-900 text-center">{arrayItem.id}</p>
            <div className={`${sliderCount > 2 ? 'flex-wrap' : 'flex-col'} flex items-center justify-center w-full`}>
                <div className={`relative bg-slate-300 aspect-square m-auto ${isFullWidth ? 'w-7/12' : 'w-72'}`}>
                    {popoutUrl && <div onClick={()=>onPopoutClick(popoutUrl)} className="absolute top-2 right-2 w-6 aspect-square hover:cursor-pointer hover:text-slate-500">{tailwindIcons.arrowTopRight}</div>}
                    {imageUrl && <img src={imageUrl} className="w-full h-full"/>}
                    <p className="text-sm text-center text-slate-500">{`True Dimensions:  [${arrayItem.attributes.structure.shape.join(', ')}]`}</p>
                </div>
                <div className={`${sliderCount > 0 ? 'w-72' : 'hidden'} flex flex-col space-y-4 pt-6 px-4`}>
                    {sliders.map((slider, index) => <InputSlider key={index} showSideInput={false} min={slider.min} max={slider.max} value={slider.value} onChange={(newValue)=>handleSliderChange(newValue, slider)}/>)}
                </div>
            </div>
        </div>
    )
}