import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { TranslatedText } from "@/components/TranslatedText";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <TranslatedText text="Oops! Page not found" as="p" className="mb-4 text-xl text-muted-foreground" />
        <a href="/" className="text-primary underline hover:opacity-80">
          <TranslatedText text="Return to Home" />
        </a>
      </div>
    </div>
  );
};

export default NotFound;
