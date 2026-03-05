import './App.css';
import Tiled from '../components/Tiled/Tiled';
import Button from '@/components/Button';
import bluesky_logo from '../assets/bluesky_tiled_logo_WithBskyLogo.svg';
import TiledSearch from '@/components/Tiled/TiledSearch';
import ManualTest from '@/components/ManualTest/ManualTest';
import { TestItemCollection } from '@/components/ManualTest/types';


function App() {

  console.log('App component rendered');
  const clearSavedTokensAndRefresh = () => {
    localStorage.removeItem('tiledAccessToken');
    localStorage.removeItem('tiledRefreshToken');
    window.location.reload();
  }

  const testItems: TestItemCollection = {
    Demo1: {
      name: 'Default View',
      element: <Tiled />,
      info: 'This is the default view which should render the viewer properly.',
      command: 'tiled serve config tiled_demo.yml'
    },
    Demo2: {
      name: 'Button Mode',
      element: <Tiled  isButtonMode={true}/>,
      info: 'This renders a button that when clicked should open up the viewer. Clicking outside the viewer should close it.',
      command: 'tiled serve config tiled_demo.yml'
    },
    Api1: {
      name: 'Button Mode with Api Key',
      element: <Tiled isButtonMode={true} inButtonModeShowApiKeyInput={true} />,
      info: 'This accepts an API key input in button mode. Note that once the API key has been set in the UI, the single Axios instance will hold onto it for any future calls. (Once you do this test, refresh the page otherwise the API key will be used for all other Tiled requests..)',
      command: 'TILED_SINGLE_USER_API_KEY=test tiled serve config tiled_api_key.yml'
    },
    Auth1: {
      name: 'Username Password Auth',
      element: <Tiled />,
      info: 'username: alice, password: test. This should display a login screen that allows a user to enter a username password to authenticate future requests',
      command: 'ALICE_PASSWORD=test tiled serve config tiled_auth.yml'
    },
    // Auth2: {
    //   name: 'OIDC Authentication',
    //   element: <Tiled oidcRedirectUrl='http://localhost:5173' />,
    //   info: 'This requires manual setup from the tester to link their ORCID account with keys and provide them to Tiled during startup. When working, the UI allows a user to follow OIDC flow in a new popup, then should automatically close and reload the component when complete',
    //   command: 'tiled serve config tiled_orcid.yml'
    // }
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
