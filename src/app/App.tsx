import './App.css';
import Tiled from '../components/Tiled/Tiled';
import Button from '@/components/Button';
import bluesky_logo from '../assets/bluesky_tiled_logo_WithBskyLogo.svg';
import TiledSearch from '@/components/Tiled/TiledSearch';
import ManualTest from '@/components/ManualTest/ManualTest';
import { TestItemCollection } from '@/components/ManualTest/types';


function App() {

  const clearSavedTokensAndRefresh = () => {
    localStorage.removeItem('tiledAccessToken');
    localStorage.removeItem('tiledRefreshToken');
    window.location.reload();
  }

  const testItems: TestItemCollection = {
    test1: {
      name: 'Test that the Tiled viewer loads successfully with valid API key.',
      element: <Tiled />
    },
    test2: {
      name: 'Test that the Tiled viewer shows an error message when an invalid API key is used.',
      element: <Tiled isButtonMode={true} />
    }
  };

  return (
    <>
      <section className="flex flex-col items-center justify-start h-screen w-screen relative">
        <div className="mb-8">
          <img 
            src={bluesky_logo} 
            alt="Bluesky Tiled Logo" 
            className="h-64 w-auto mx-auto opacity-80 mt-8 hover:animate-pulse"
          />
        </div>
        {/* <Tiled isButtonMode={true} size='medium' tiledBaseUrl='http://tiled.localhost:8000/api/v1'/>
        <Button cb={clearSavedTokensAndRefresh} text="Clear saved tokens and Refresh" isSecondary={true} styles='mt-12'/>
        <Tiled isPopup={true}  tiledBaseUrl='http://tiled.localhost:8000/api/v1' pageLimit={10} reloadLastItemOnStartup={true} onSelectCallback={(data) => console.log(data)} includeAuthTokensInSelectCallback={true} oidcRedirectUrl='http://localhost:5173'/> */}
        <ManualTest testItems={testItems} />
      </section>
    </>
  )

}

export default App
