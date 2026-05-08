import './App.css';
import Tiled from '../components/Tiled/Tiled';
import bluesky_logo from '../assets/bluesky_tiled_logo_WithBskyLogo.svg';
import ManualTest from '@/components/ManualTest/ManualTest';
import { TestItemCollection } from '@/components/ManualTest/types';


function App() {

  const testItems: TestItemCollection = {
    Demo1: {
      name: 'Default View',
      element: <Tiled/>,
      info: 'This is the default view which should render the viewer properly.',
      command: 'tiled serve config tiled/tiled_demo.yml'
    },
    Demo2: {
      name: 'Row Mode',
      element: <Tiled displayMode='rows'/>,
      info: 'This is the second view mode which renders all items in a single column with indented rows to indicate depth. The right column will always preview the selected container or data',
      command: 'tiled serve config tiled/tiled_demo.yml'
    },
    Demo3: {
      name: 'Button Mode',
      element: <Tiled  isButtonMode={true}/>,
      info: 'This renders a button that when clicked should open up the viewer. Clicking outside the viewer should close it.',
      command: 'tiled serve config tiled/tiled_demo.yml'
    },
    Api1: {
      name: 'Button Mode with Api Key',
      element: <Tiled isButtonMode={true} inButtonModeShowApiKeyInput={true} />,
      info: 'Enter "test" into the form. This accepts an API key input in button mode. Note that once the API key has been set in the UI, the single Axios instance will hold onto it for any future calls. (Once you do this test, refresh the page otherwise the API key will be used for all other Tiled requests..)',
      command: 'TILED_SINGLE_USER_API_KEY=test tiled serve config tiled/tiled_api_key.yml'
    },
    Auth1: {
      name: 'Username Password Auth',
      element: <Tiled />,
      info: 'username: alice, password: test. This should display a login screen that allows a user to enter a username password to authenticate future requests',
      command: 'ALICE_PASSWORD=test tiled serve config tiled/tiled_username_password.yml'
    },
    Auth2: {
      name: 'OIDC Flow',
      element: <Tiled tiledBaseUrl='http://tiled.localhost:8000/api/v1' oidcRedirectUrl='http://localhost:5173'/>,
      info: 'Tests if Tiled can follow OIDC flow. Follow the instructions in the README: ',
      link: 'https://github.com/bluesky/tiled-viewer-react/blob/main/tiled/README.md#orcid-oidc-setup-instructions',
      command: 'tiled serve config tiled/tiled_oidc.yml'
    },
    // Auth3: {
    //   name: 'OIDC Authentication Central Tiled',
    //   element: <Tiled tiledBaseUrl='https://tiled.computing.als.lbl.gov/api/v1' oidcRedirectUrl='http://tiled-test:5174' />,
    //   info: 'Run the vite app under tiled-test:5174 to get around CORS. Configure /etc/hosts to point to localhost for tiled-test.',
    //   command: 'tiled serve config tiled_orcid.yml'
    // }
  };

  return (
    <>
      <section className="flex flex-col items-center justify-start h-screen w-screen relative">
        <div className="absolute top-0 left-0 w-fit">
          <img 
            src={bluesky_logo} 
            alt="Bluesky Tiled Logo" 
            className="h-16 w-auto mx-auto opacity-80 hover:animate-pulse ml-2 mt-2"
          />
        </div>
        <ManualTest testItems={testItems} />
      </section>
    </>
  )

}

export default App
