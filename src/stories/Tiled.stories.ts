import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor } from '@storybook/test';
import Tiled from '../components/Tiled/Tiled';
import { tiledHandlers } from '@/testing/mocks/handlers';


const meta = {
    title: 'Bluesky Components/Tiled',
    component: Tiled,
    parameters: {
      layout: 'centered',
      msw: {
        handlers: tiledHandlers,
      }
    },
    tags: ['autodocs'],
    argTypes: {
    }
} satisfies Meta<typeof Tiled>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    enableStartupScreen: false,
    size: 'medium',
    tiledBaseUrl: 'https://tiled-demo.blueskyproject.io/api/v1'
  },
  play: async ( { canvas } ) => {        
    await expect(canvas.getByText('Tiled')).toBeInTheDocument();
    await expect(canvas.getByAltText('Bluesky Logo')).toBeInTheDocument();
    const header = canvas.getByTestId('tiled-header');
    await userEvent.click(header);
    // Wait for the DOM to update after the click
    await waitFor(async () => {
      const singleColumn = canvas.getAllByRole('list');
      console.log({singleColumn});
      await expect(singleColumn.length).toBe(1);
    });
    const  sampleFolder = await canvas.findByText('sampleFolder');
    await userEvent.click(sampleFolder);
    await waitFor(async () => {
      const twoColumns = canvas.getAllByRole('list');
      console.log({twoColumns});
      await expect(twoColumns.length).toBe(2);
    });
  }
};

export const LocalHostUrl: Story = {
    args: {
      size: 'medium',
    },
  };

export const CustomUrl: Story = {
    args: {
      enableStartupScreen: true,
      size: 'medium',
    },
  };

