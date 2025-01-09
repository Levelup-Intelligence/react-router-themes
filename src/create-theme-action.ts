import type { ActionFunctionArgs } from 'react-router';
import { isTheme } from './theme-provider';
import type { ThemeSessionResolver } from './theme-server';

/**
 * Creates a theme action handler.
 *
 * @param themeSessionResolver - A function to manage theme sessions.
 * @returns A function to handle theme changes.
 */
export const createThemeAction = (
  themeSessionResolver: ThemeSessionResolver,
) => {
  return async ({ request }: ActionFunctionArgs): Promise<Response> => {
    const session = await themeSessionResolver(request);

    try {
      const { theme } = await request.json();

      if (typeof theme !== 'string' || theme.trim() === '') {
        // Handle empty or invalid theme input
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              'Set-Cookie': await session.destroy(),
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (!isTheme(theme)) {
        // Handle invalid theme
        return new Response(
          JSON.stringify({
            success: false,
            message: `theme value of ${theme} is not a valid theme.`,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Valid theme, save it in the session
      session.setTheme(theme);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            'Set-Cookie': await session.commit(),
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      // Catch and return a server error
      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid request body or server error: ${(error as Error).message}`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  };
};
