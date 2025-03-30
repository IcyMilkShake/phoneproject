// Selecting HTML elements
const usersName = document.getElementById("usersName");
const notes = document.getElementById("notes");
const setting = document.getElementById("setting");
const WIP = document.getElementById("WIP");
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');

function showContent() {
    loadingScreen.style.display = 'none';
    mainContent.style.display = 'block';
}

function forceRepaint() {
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
}

async function loadAppearances() {
    try {
        const response = await fetch('/appearances');
        const result = await response.json();
        if (result.light == true) {
            document.documentElement.style.setProperty('--bg-dark', '#FFFFFF');
            document.documentElement.style.setProperty('--card-dark', '#e6e6e6');
            document.documentElement.style.setProperty('--text-primary', '#1c1c1c');
            document.documentElement.style.setProperty('--text-secondary', '#0d0d0d');
            document.documentElement.style.setProperty('--border-color', '#9c9c9c');
            document.documentElement.style.setProperty('--accent-color', '#b0b0b0');
            document.documentElement.style.setProperty('--hover-color', '#c2c2c2');
            document.documentElement.style.setProperty('--buttons', '#d1d1d1')
            forceRepaint()
        }
        if (result.midnight == true) {
            document.documentElement.style.setProperty('--bg-dark', '#000000');
            document.documentElement.style.setProperty('--card-dark', '#080b0f');
            document.documentElement.style.setProperty('--text-primary', '#636363');
            document.documentElement.style.setProperty('--text-secondary', '#4d4d4d');
            document.documentElement.style.setProperty('--border-color', '#0d0d0d');
            document.documentElement.style.setProperty('--accent-color', '#151c26');
            document.documentElement.style.setProperty('--hover-color', '#1c2633');
            document.documentElement.style.setProperty('--buttons', '#0e131a')
            forceRepaint()
        }
    } catch (error) {
        console.error('Error loading appearances:', error);
    }
}

// Adding event listeners for navigation
notes.addEventListener('click', () => {
    window.location.href = 'notes.html';
});

setting.addEventListener('click', () => {
    window.location.href = 'setting.html';
});

// Function to fetch profile picture
async function fetchpic() {
    try {
        const imgElement = document.getElementById('userProfilePic');
        const response = await fetch('/user/profile', { credentials: 'same-origin' });

        if (response.ok) {
            const data = await response.json();
            imgElement.src = data.profilePicture; // Set the profile picture path
        } else {
            imgElement.src = '/uploads/profile_pics/default-profile.png'; // Default image fallback
        }
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }
}

async function fetching() {
    try {
        const response = await fetch('/users', { credentials: 'same-origin' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.message === "Please Login First") {
            window.location.href = 'login.html';
            return;
        }

        const resultName = result.name;
        const nameParts = resultName.split('#');
        const displayName = nameParts[0]; // The part before the '#'
        const sequenceNumber = nameParts[1]; // The part after the '#'

        const usersName = document.getElementById('usersName');

        // Create a span element for the name part (before the '#')
        const nameSpan = document.createElement('span');
        nameSpan.textContent = displayName;

        // Create a span element for the sequence number part (after the '#')
        const numberSpan = document.createElement('span');
        numberSpan.textContent = `#${sequenceNumber}`;
        numberSpan.style.opacity = '0.4'; // Apply 40% opacity to the number part

        // Append the elements to the usersName container
        usersName.textContent = 'Welcome ';
        usersName.appendChild(nameSpan);
        usersName.appendChild(numberSpan,"!");
        await fetchpic(); // Fetch the profile picture
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// Initialize the page
async function initializePage() {
    await Promise.all([
        loadAppearances(),
        fetching()
    ]);
    showContent(); // Show content after all data is loaded
}

initializePage();