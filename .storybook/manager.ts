import { addons } from '@storybook/addons';
import { create } from '@storybook/theming';

const basePath = window.location.pathname.startsWith('/tiled-viewer-react') ? '/tiled-viewer-react' : ''; //required to work on both local dev and gh pages

//switch themes based on user preference
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

const brandImageUrl = prefersDarkMode
  ? basePath + '/images/finchBannerSmallDarkmode.png'
  : basePath + '/images/finchBannerSmall.png'; 

const customTheme = create({
  base: prefersDarkMode ? 'dark' : 'light',
  brandTitle: 'Finch UI',
  brandUrl: 'https://github.com/bluesky/tiled-viewer-react',
  brandImage: brandImageUrl, 
});

addons.setConfig({
  theme: customTheme,
});