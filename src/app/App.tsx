import './App.css';
import Tiled from '../components/Tiled/Tiled';
import Button from '@/components/Button';
import bluesky_logo from '../assets/bluesky_tiled_logo_WithBskyLogo.svg';
import TiledSearch from '@/components/Tiled/TiledSearch';


function App() {

  const clearSavedTokensAndRefresh = () => {
    localStorage.removeItem('tiledAccessToken');
    localStorage.removeItem('tiledRefreshToken');
    window.location.reload();
  }


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
        <TiledSearch />
        <Tiled isButtonMode={true} size='medium' tiledBaseUrl='http://tiled.localhost:8000/api/v1'/>
        <Button cb={clearSavedTokensAndRefresh} text="Clear saved tokens and Refresh" isSecondary={true} styles='mt-12'/>
        <Tiled isPopup={true} reverseSort={true} tiledBaseUrl='http://tiled.localhost:8000/api/v1'/>
      </section>
    </>
  )

}

export default App
