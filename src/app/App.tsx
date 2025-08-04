import { useMemo } from 'react';
import './App.css';
import Tiled from '../components/Tiled/Tiled';
import Example from '@/components/scatterExample/Example';
import ParentSize from '@visx/responsive/lib/components/ParentSize';


const sampleData = [
  {A: 1, B: 1.4, C: 2},
  {A: 2, B: 1.6, C: 2.2},
  {A: 3, B: 1.8, C: 2.4},
  {A: 4, B: 2.0, C: 2.6},
  {A: 5, B: 2.2, C: 2.8},
  {A: 6, B: 2.4, C: 3.0},
  {A: 7, B: 2.6, C: 3.2},
  {A: 8, B: 2.8, C: 3.4},
  {A: 9, B: 3.0, C: 3.6},
  {A: 10, B: 3.2, C: 3.8},
  {A: 11, B: 3.4, C: 4.0},
];

function App() {
  const dataWithIndex = useMemo(() => 
      sampleData.map((d, index) => ({ ...d, __index: index })), 
      [sampleData]
  );



  return (
    <>
      <Tiled isButtonMode={true} size='medium'/>
      <Tiled isPopup={true}/>
    </>
  )

}

export default App
