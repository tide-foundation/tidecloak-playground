/**
 * Hook to wrap API calls with automatic token refresh on failure
 */
export function useApiWithTokenRefresh(auth) {
  /**
   * Wraps an API call with automatic token refresh and retry on 401 errors
   * @param {Function} apiCall - Async function that makes the API call
   * @param {string} errorContext - Description of what operation failed
   * @returns {Promise} - Result of the API call
   */
  const callWithRefresh = async (apiCall, errorContext = "API call") => {
    try {
      // First attempt
      return await apiCall();
    } catch (error) {
      // Check if it's a 401 error (token expired)
      if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        console.log(`Token expired during ${errorContext}, force refreshing and retrying...`);
        try {
          // Force refresh the token immediately (not just when expired)
          await auth.forceUpdateToken();
          // Wait a bit for the token to be updated
          await new Promise(resolve => setTimeout(resolve, 500));
          // Retry the API call
          return await apiCall();
        } catch (refreshError) {
          console.error(`Token force refresh failed during ${errorContext}:`, refreshError);
          throw refreshError;
        }
      }
      // If not a 401 error, just throw it
      throw error;
    }
  };

  return { callWithRefresh };
}
