import { isValidUrl } from './common';

/**
 * Fetch data from a given URL with optional options.
 * @param {string} url - The URL to fetch data from.
 * @param {object} [options] - Optional fetch configuration.
 * @returns {Promise<any|null>} - The fetched data or null if an error occurs.
 */
interface FetchOptions {
  headers?: Record<string, string>;
}

export async function fetchData(url: string, options: FetchOptions = {}) {
  try {
    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
    const response = await fetch(url, {
      ...options,
      headers: {
        // 'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch data from ${url}: ${response.statusText}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
}

/**
 * Fetch data from a given URL with optional options.
 * @param {string} url - The URL to fetch data from.
 * @param {object} [options] - Optional fetch configuration.
 * @returns {Promise<any|null>} - The fetched data or null if an error occurs.
 */

export async function fetchJsonData(url: string, options: FetchOptions = {}) {
  try {
    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
    const response = await fetch(url, options ? { ...options } : {});

    if (!response.ok) {
      console.error(`Failed to fetch data from ${url}: ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
  }
}

/**
 * Post data to a given URL with optional options.
 * @param {string} url - The URL to post data to.
 * @param {object} data - The data to post.
 * @param {object} [options] - Optional fetch configuration.
 * @returns {Promise<any|null>} - The response data or null if an error occurs.
 */
export async function postData(
  url: string,
  data: any,
  options: FetchOptions = {}
) {
  try {
    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
    const response = await fetch(url, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`Failed to post data to ${url}: ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error posting data to ${url}:`, error);
    return null;
  }
}
