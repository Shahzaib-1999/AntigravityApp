import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

// Initialize GA4 - Replace 'G-XXXXXXXXXX' with your actual Measurement ID
// You can also use an environment variable: import.meta.env.VITE_GA_MEASUREMENT_ID
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

export default function GoogleAnalytics() {
    const location = useLocation();

    useEffect(() => {
        // Initialize Google Analytics once
        if (GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
            ReactGA.initialize(GA_MEASUREMENT_ID);
        }
    }, []);

    useEffect(() => {
        // Send pageview on route change
        if (GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [location]);

    return null;
}
