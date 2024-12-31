
//dropdown-fetch
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
    console.log("start")
    /**
     * Fetch client information (client_id and client_secret).
     */
    const fetchClientInfo = async () => {
        const response = await fetch("https://jotform-calendar-ids.njkfmqn6rf.workers.dev/", {
            method: "GET",
            headers: {
                Origin: window.location.origin,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch client info.");
        }

        const { client_id, client_secret } = await response.json();
        console.log("got client")
        return { client_id, client_secret };
    };

    /**
     * Refresh the access token using a refresh token.
     */
    const refreshAccessToken = async (refreshToken) => {
        const { client_id, client_secret } = await fetchClientInfo();

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
        console.log("got token")
        return {
            accessToken: data.access_token,
            expiryTime: Date.now() + data.expires_in * 1000,
        };
    };

    /**
     * Fetches calendars for the given user from Firestore.
     * Populates a dropdown with calendar names and IDs.
     * @param {Object} user - The current user object (must include a `uid`).
     */
    const fetchCalendarsFromFirestore = async (user) => {
        console.log("in fetch")
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
            const calendars = calendarData.items.filter(item => item.accessRole === "owner");

            console.log("afterfetch", calendarData)
            // Populate the dropdown
            const dropdown = document.getElementById("84658d9aff374e66252e6c89.calendarId");
            if (!dropdown) {
                console.error("Dropdown element not found.");
                return calendars;
            }

            // Clear existing options
            dropdown.innerHTML = "";

            // Add a default placeholder option
            const placeholderOption = document.createElement("option");
            placeholderOption.value = "";
            placeholderOption.textContent = "Select a calendar";
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            dropdown.appendChild(placeholderOption);

            // Add options for each calendar
            calendars.forEach(calendar => {
                const option = document.createElement("option");
                option.value = calendar.id; // Use calendar ID as the value
                option.textContent = calendar.summary; // Use calendar name as the display text
                dropdown.appendChild(option);
            });

            return calendars; // Return the calendars for further use if needed
        } catch (error) {
            console.error("Error fetching calendars:", error);

            // Handle dropdown error message
            const dropdown = document.getElementById("calendar-dropdown");
            if (dropdown) {
                dropdown.innerHTML = "";
                const errorOption = document.createElement("option");
                errorOption.value = "";
                errorOption.textContent = "Failed to load calendars";
                errorOption.disabled = true;
                dropdown.appendChild(errorOption);
            }

            throw error;
        }
    };

    // Return the main function for UMD
    return fetchCalendarsFromFirestore;
});
