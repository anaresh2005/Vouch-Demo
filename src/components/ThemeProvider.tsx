import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { ComponentProps, useEffect } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

function ThemeTransitionHandler({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    // Disable transitions during theme change to prevent flickering
    document.documentElement.classList.add('disable-transitions');
    const timeout = setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 50);

    return () => clearTimeout(timeout);
  }, [theme]);

  return <>{children}</>;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeTransitionHandler>{children}</ThemeTransitionHandler>
    </NextThemesProvider>
  );
}
