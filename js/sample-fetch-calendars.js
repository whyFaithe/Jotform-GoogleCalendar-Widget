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
    const { firestore, doc, getDoc, setDoc } = window.firebase || require("firebase/firestore");

    /**
     * Fetch client information (client_id and client_secret).
     */
    const fetchClientInfo = async () => {
    const response = await fetch("https://jotform-calendar-ids.njkfmqn6rf.workers.dev/get-client-info", {
        method: "GET",
        headers: {
            Origin: window.location.origin,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch client info.");
    }

    const { client_id, client_secret } = await response.json();
    return { client_id, client_secret };
};


    /**
     * Refresh the access token using a refresh token.
     */
    const refreshAccessToken = async (refreshToken) => {
        //{ client_id, client_secret } = await fetchClientInfo();
       
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id,
                client_secret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to refresh access token.");
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            expiryTime: Date.now() + data.expires_in * 1000,
        };
    };

    /**
     * Fetches calendars for the given user from Firestore.
     * @param {Object} user - The current user object (must include a `uid`).
     */
    const fetchCalendarsFromFirestore = async (user) => {
        if (!user || !user.uid) {
            throw new Error("Invalid user object. Please provide a valid user.");
        }

        try {
            console.log("Fetching calendars...");
            const userRef = doc(firestore, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                throw new Error("User data not found in Firestore.");
            }

            const { accessToken, refreshToken, expiryTime } = userDoc.data();

            let token = accessToken;
            if (Date.now() > expiryTime) {
                console.log("Token expired, refreshing...");
                const refreshed = await refreshAccessToken(refreshToken);
                token = refreshed.accessToken;

                await setDoc(userRef, { accessToken: token, expiryTime: refreshed.expiryTime }, { merge: true });
            }

            const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                headers: {
                    Authorization: `Bearer ${token}`,
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

