import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import './Tiled.css';

type TiledBodyProps = {
    children?: React.ReactNode;
}

// export default function TiledBody({
//     children,
//     ...props
// }: TiledBodyProps) {
//     const scrollContainerRef = useRef<HTMLDivElement>(null);



//     return (
    //         <div className="w-full flex min-h-0 flex-grow border overflow-x-auto scrollbar-always-visible " ref={scrollContainerRef} {...props}>
    //             {children}
    //         </div>
    //     )
    // }
    const TiledBody = forwardRef<HTMLDivElement, TiledBodyProps>(({ children, ...props }, ref) => {
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        
        // Expose internal ref to parent via forwarded ref
        useImperativeHandle(ref, () => scrollContainerRef.current!, []);
        
        useEffect(() => {
            //when columns load scroll to the right
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
            } 
        }, [children]);
    return (
        <div
            className="w-full flex min-h-0 flex-grow border overflow-x-auto scrollbar-always-visible"
            ref={scrollContainerRef}
            {...props}
        >
            {children}
        </div>
    );
});

export default TiledBody;