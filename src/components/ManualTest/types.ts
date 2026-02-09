export interface TestItem {
    name: string;
    element: JSX.Element;
}

export interface TestItemCollection {
    [key: string]: TestItem;
}


export interface ManualTestItemRow extends TestItem {
    comment?: string;
    isPassing: boolean;
}

export interface ManualTestCollection {
    [key: string]: ManualTestItemRow;
}