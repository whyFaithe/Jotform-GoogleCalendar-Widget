(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        // Node.js or CommonJS
        module.exports = factory();
    } else {
        // Browser or other environments
        global.fetchCalendarsFromFirestore = factory();
    }
})(typeof window !== "undefined" ? window : this, function () {
    // Firebase imports
    const { firestore, doc, getDoc } = window.firebase || require("firebase/firestore");

    /**
     * Fetches an access token using client_id and client_secret.
     * @param {string} client_id - The client ID.
     * @param {string} client_secret - The client secret.
     */
    const fetchAccessToken = async (client_id, client_secret) => {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id,
                client_secret,
                grant_type: "client_credentials",
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch access token.");
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            expiryTime: Date.now() + data.expires_in * 1000,
        };
    };

    /**
     * Fetches calendars for the given user from Firestore using client_id and client_secret.
     * @param {Object} user - The current user object (must include a `uid`).
     * @param {string} client_id - The client ID.
     * @param {string} client_secret - The client secret.
     */
    const fetchCalendarsFromFirestore = async (user, client_id, client_secret) => {
        if (!user || !user.uid) {
            throw new Error("Invalid user object. Please provide a valid user.");
        }

        try {
            console.log("Fetching calendars...");

            // Fetch user document from Firestore
            const userRef = doc(firestore, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                throw new Error("User data not found in Firestore.");
            }

            // Get a new access token using client_id and client_secret
            console.log("Fetching access token...");
            const { accessToken } = await fetchAccessToken(client_id, client_secret);

            // Fetch calendar list
            const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch calendars.");
            }

            const calendarData = await response.json();
            return calendarData.items.filter(item => item.accessRole === "owner");
        } catch (error) {
            console.error("Error fetching calendars:", error);
            throw error;
        }
    };

    // Return the main function for UMD
    return fetchCalendarsFromFirestore;
});


