import { describe, it, expect, beforeEach } from 'vitest';
import {
    setGlobalUrl,
    setGlobalApiKey,
    getDefaultTiledUrl,
    resetGlobalState,
} from '../../components/Tiled/apiClient';

beforeEach(() => {
    resetGlobalState();
    setGlobalUrl(null);
});

describe('setGlobalUrl', () => {
    it('causes getDefaultTiledUrl to return the set URL', () => {
        setGlobalUrl('https://my-tiled-server.com/api/v1');
        expect(getDefaultTiledUrl()).toBe('https://my-tiled-server.com/api/v1');
    });

    it('strips trailing slashes via cleanUrl', () => {
        setGlobalUrl('https://my-tiled-server.com/api/v1/');
        expect(getDefaultTiledUrl()).toBe('https://my-tiled-server.com/api/v1');
    });

    it('adds https:// when protocol is missing for non-local URLs', () => {
        setGlobalUrl('my-tiled-server.com/api/v1');
        expect(getDefaultTiledUrl()).toBe('https://my-tiled-server.com/api/v1');
    });

    it('adds http:// when protocol is missing for localhost URLs', () => {
        setGlobalUrl('localhost:8000/api/v1');
        expect(getDefaultTiledUrl()).toBe('http://localhost:8000/api/v1');
    });

    it('returns the hostname-based default after being cleared with null', () => {
        setGlobalUrl('https://my-tiled-server.com/api/v1');
        setGlobalUrl(null);
        expect(getDefaultTiledUrl()).toBe('http://localhost:8000/api/v1');
    });
});

describe('setGlobalApiKey', () => {
    it('returns the key that was set', () => {
        const result = setGlobalApiKey('my-api-key');
        expect(result).toBe('my-api-key');
    });

    it('returns null after being cleared', () => {
        setGlobalApiKey('my-api-key');
        const result = setGlobalApiKey(null);
        expect(result).toBeNull();
    });
});
