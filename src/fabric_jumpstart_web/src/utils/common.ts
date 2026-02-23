/**
 * Truncates the given text to the specified maximum length.
 * If the text exceeds the maximum length, it appends "..." at the end.
 * @param text - The text to be truncated.
 * @param maxLength - The maximum length of the truncated text.
 * @returns The truncated text.
 */
export const truncateText = (text: string, maxLength: number): string => {
  let truncatedText = text;
  if (truncatedText.length > maxLength) {
    truncatedText = truncatedText.slice(0, maxLength);
    const words = truncatedText.split(' ');
    truncatedText = words.slice(0, words.length - 1).join(' ') + '...';
  }
  return truncatedText;
};

/**
 * Splits the given heading into two parts: the first half and the last word.
 * @param heading - The heading to be split.
 * @returns An object containing the first half and the last word of the heading.
 */
export const splitHeading = (
  heading: string
): { firstHalf: string; lastWord: string } => {
  const splitHeading = heading.split(' ');
  const firstHalf = splitHeading.slice(0, splitHeading.length - 1).join(' ');
  const lastWord = splitHeading[splitHeading.length - 1];
  return { firstHalf, lastWord };
};

/**
 * Checks if the current device is a mobile or tablet device.
 * @returns True if the device is a mobile or tablet, false otherwise.
 */
export const isMobileOrTablet = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for mobile devices
  const isMobile = /mobile/i.test(userAgent);

  // Check for tablets
  const isTablet =
    /tablet/i.test(userAgent) ||
    (navigator.userAgent.includes('Android') &&
      !navigator.userAgent.includes('Mobile'));

  return isMobile || isTablet;
};

export const copyToClipboard = (e: React.MouseEvent, id: any) => {
  e.preventDefault();
  const el = document.createElement('textarea');
  el.value = id;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const isValidUrl = (url: string) => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

/**
 * Calculates the difference in days between the current date and a given date.
 *
 * @param lastModified - The last modified date as a string in the format 'YYYY-MM-DD'.
 * @param createdDate - The created date as a string in the format 'YYYY-MM-DD'.
 * @returns The difference in days between the current date and the given date.
 *
 * @remarks
 * If `lastModified` is provided, it will be used to calculate the difference.
 * Otherwise, `createdDate` will be used.
 *
 * @example
 * ```typescript
 * const daysDiff = calculateDateDiff('2023-10-01', '2023-09-01');
 * console.log(daysDiff); // Outputs the number of days between the current date and '2023-10-01'
 * ```
 */
export const calculateDateDiff = (
  lastModified: string,
  createdDate: string
) => {
  // Get the current date in milliseconds
  const currentDate = new Date().getTime();
  // Get the last modified date or created date of the drop in milliseconds
  const lastModifiedDate = new Date(
    lastModified
      ? lastModified.substring(0, 10) // Use LastModified if available
      : createdDate.substring(0, 10) // Otherwise, use CreatedDate
  ).getTime();
  // Calculate the difference in milliseconds
  let diff = currentDate - lastModifiedDate;
  // Convert the difference from milliseconds to days
  diff = Math.round(diff / (1000 * 3600 * 24));
  return diff;
};

/**
 * Shares a link using the Web Share API if supported by the browser.
 *
 * @param title - The title of the content to be shared.
 * @param summary - A brief summary or description of the content to be shared.
 * @returns A promise that resolves when the share action is complete.
 *
 * @remarks
 * If the Web Share API is not supported by the browser, a warning is logged to the console.
 *
 * @example
 * ```typescript
 * shareLink('My Article', 'This is a summary of my article.')
 *   .then(() => console.log('Content shared successfully.'))
 *   .catch((error) => console.error('Error sharing content:', error));
 * ```
 */
export const shareLink = async (
  title: string,
  summary: string,
  url: string
) => {
  if (navigator.share) {
    await navigator.share({
      title: title,
      url: url,
      text: summary,
    });
  } else {
    console.warn('Web Share API is not supported in this browser.');
  }
};

/**
 * Converts a given string to camel case, where the first letter is capitalized and the rest are in lowercase.
 * @param text - The text to be converted.
 * @returns The camel case converted text.
 *
 * @example
 * ```typescript
 * const camelCaseText = toCamelCase('hello WORLD');
 * console.log(camelCaseText); // Outputs: 'Hello world'
 * ```
 */
export const toCamelCase = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const dateformatter = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const isSmallerDevice = () => {
  return window.innerWidth < 769;
};

/**
 * Calls the provided callback function if the Enter key is pressed during the event.
 * @param event - The keyboard event.
 * @param callback - The callback function to be called if Enter is pressed.
 */
export const callOnEnter = (
  event: React.KeyboardEvent<HTMLElement>,
  callback: () => void
) => {
  if (event.key === 'Enter') {
    callback && callback();
  }
};

/**
 * Throttles the execution of a function to ensure it is only called once every specified interval.
 * @param func - The function to be throttled.
 * @param limit - The interval in milliseconds to throttle the function.
 * @returns A throttled version of the function.
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll event');
 * }, 300);
 *
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export const throttle = (func: (...args: any[]) => void, limit: number) => {
  let lastFunc: number;
  let lastRan: number;
  return function (...args: any[]) {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = window.setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func(...args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan)
      );
    }
  };
};

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>): void {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export const createObjFromListAndLocale = (
  list: { value: string; id: string }[],
  localFunc: (key: string) => string,
  localeStr: string
): { value: string; id: string; label: string }[] => {
  return list.map((item) => ({
    value: item.value,
    id: item.id,
    label: localFunc(`${localeStr}.${item.id}.label`),
  }));
};

/**
 * Checks if the given URL matches a specific pattern.
 *
 * The pattern matches URLs that start with optional protocols (http, https) and optional "www",
 * followed by at least two alphanumeric characters, a dot, at least two more alphanumeric characters,
 * an optional second dot, and at least two more alphanumeric characters, followed by a slash and
 * at least two alphanumeric characters.
 *
 * @param url - The URL string to be validated.
 * @returns `true` if the URL matches the pattern, otherwise `false`.
 */
export const isValidUrlPattern = (url: string) => {
  const urlPattern =
    /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?\/[a-zA-Z0-9]{2,}/g;
  return urlPattern.test(url);
};

export const isWithinPastMonth = (dateString: string) => {
  const dateObj = new Date(dateString);

  const today = new Date();

  const oneMonthAgo = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    today.getDate()
  );

  if (oneMonthAgo.getDate() !== today.getDate()) {
    oneMonthAgo.setDate(0);
  }

  return dateObj >= oneMonthAgo && dateObj < today;
};

// A function to clean and validate the RSA private key in Next.js
export const cleanPrivateKey = (key: string): string => {
  const base = key
    .replace('-----BEGIN RSA PRIVATE KEY----- ', '')
    .replace('-----END RSA PRIVATE_KEY-----', '');
  console.log('base >>>>>>>>>', base);
  if (base) {
    const cleanedKey = base.replace(/\s/g, ''); // Remove all whitespace or newlines in base64 data
    return `-----BEGIN RSA PRIVATE KEY-----\n${cleanedKey}\n-----END RSA PRIVATE KEY-----`;
  } else {
    throw new Error('Invalid RSA Private Key format');
  }
};
