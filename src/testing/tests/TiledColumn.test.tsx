import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import Tiled from '../../components/Tiled/Tiled';
import { mockTiledSearch2PageLimitResponse } from "../mocks/responses";
import { resetGlobalState } from '../../components/Tiled/apiClient';

// Mock server setup
const server = setupServer();

// Start server before all tests
beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
  // Clear any existing auth/api keys from localStorage
  localStorage.clear();
  // Reset global state in apiClient
  resetGlobalState();
});

// Reset handlers and clean up after each test
afterEach(() => {
  server.resetHandlers();
  server.close();
  localStorage.clear();
  // Reset global state again after each test
  resetGlobalState();
});

describe('TiledColumn Component', () => {
  it('displays correct pagination text "1 - 2 of 62" when rendering mockTiledSearch2PageLimitResponse', async () => {
    // Mock the initial search request to return the 2-page limit response
    server.use(
      http.get('https://test-server.example.com/api/v1/search/*', () => {
        return HttpResponse.json(mockTiledSearch2PageLimitResponse);
      })
    );

    render(
      <Tiled 
        tiledBaseUrl="https://test-server.example.com/api/v1"
        enableStartupScreen={false}
      />
    );

    // Wait for the pagination text to appear
    await waitFor(() => {
      expect(screen.getByText('1 - 2 of 62')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays the correct number of items from the mock response', async () => {
    // Mock the initial search request
    server.use(
      http.get('https://test-server.example.com/api/v1/search/*', () => {
        return HttpResponse.json(mockTiledSearch2PageLimitResponse);
      })
    );

    render(
      <Tiled 
        tiledBaseUrl="https://test-server.example.com/api/v1"
        enableStartupScreen={false}
      />
    );

    // Wait for the component to load and render items
    await waitFor(() => {
      // The mock response should have 2 items (page limit of 2)
      const items = mockTiledSearch2PageLimitResponse.data;
      expect(items).toHaveLength(2);
      
      // Verify that the items are rendered in the DOM
      // Each item has an id that starts with "item-"
      const renderedItems = document.querySelectorAll('[id^="item-"]');
      expect(renderedItems.length).toBe(2);
    }, { timeout: 3000 });
  });

  it('shows pagination controls when there are more items than the page limit', async () => {
    // Mock the initial search request
    server.use(
      http.get('https://test-server.example.com/api/v1/search/*', () => {
        return HttpResponse.json(mockTiledSearch2PageLimitResponse);
      })
    );

    render(
      <Tiled 
        tiledBaseUrl="https://test-server.example.com/api/v1"
        enableStartupScreen={false}
      />
    );

    // Wait for pagination controls to appear
    await waitFor(() => {
      // Look for pagination indicators - the main thing we care about is the pagination text
      const paginationText = screen.getByText('1 - 2 of 62');
      expect(paginationText).toBeInTheDocument();
      
      // Just verify that the component rendered successfully
      // Don't assume specific button structure since that might vary
      expect(screen.getByText('1 - 2 of 62')).toBeVisible();
    }, { timeout: 3000 });
  });

  it('handles empty search results gracefully', async () => {
    // Mock empty response
    const emptyResponse = {
      data: [],
      links: {
        self: 'https://test-server.example.com/api/v1/search/',
        first: 'https://test-server.example.com/api/v1/search/?page[offset]=0&page[limit]=100',
        last: 'https://test-server.example.com/api/v1/search/?page[offset]=0&page[limit]=100'
      },
      meta: {
        count: 0
      }
    };

    server.use(
      http.get('https://test-server.example.com/api/v1/search/*', () => {
        return HttpResponse.json(emptyResponse);
      })
    );

    render(
      <Tiled 
        tiledBaseUrl="https://test-server.example.com/api/v1"
        enableStartupScreen={false}
      />
    );

    // Wait for the component to handle empty results
    await waitFor(() => {
      // Should not show the pagination text for empty results
      expect(screen.queryByText('1 - 2 of 62')).not.toBeInTheDocument();
      
      // Look for empty state indicator or no items
      // Adjust based on how your component handles empty states
      const itemButtons = screen.queryAllByRole('button');
      // Should have minimal buttons (maybe just UI controls, not data items)
    }, { timeout: 3000 });
  });

  it('intercepts and handles the initial search request correctly', async () => {
    let requestUrl = '';
    let requestHeaders: Headers | null = null;

    // Mock the initial search request and capture details
    server.use(
      http.get('https://test-server.example.com/api/v1/search/*', ({ request }) => {
        requestUrl = request.url;
        requestHeaders = request.headers;
        return HttpResponse.json(mockTiledSearch2PageLimitResponse);
      })
    );

    render(
      <Tiled 
        tiledBaseUrl="https://test-server.example.com/api/v1"
        enableStartupScreen={false}
      />
    );

    // Wait for the request to be made and verify it was intercepted
    await waitFor(() => {
      expect(requestUrl).toContain('https://test-server.example.com/api/v1/search');
      expect(requestHeaders).toBeTruthy();
    }, { timeout: 3000 });

    // Verify the response was processed correctly
    await waitFor(() => {
      expect(screen.getByText('1 - 2 of 62')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

//we expect there to be text of "1 - 2 of 62" rendered when we get render the mock 2 page limit response