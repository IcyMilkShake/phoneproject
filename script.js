// Move all inline scripts here

const username = document.getElementById("username");
const pass = document.getElementById("password");
const email = document.getElementById("email");
const submit = document.getElementById("submit");

const loginRedirect = document.getElementById('loginRedirect');
loginRedirect.addEventListener('click', () => {
    window.location.href = 'login.html'; 
});

async function checkloggedin() {
    try {
        const response = await fetch('/checkloggedin', { credentials: 'same-origin' });

        const data = await response.json();

        if (data.message == "You are already logged in. Redirecting to the main page...") {
            alert(data.message)
            window.location.href = 'main.html';
        } else {
            console.log(data.message)
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}
checkloggedin();

function handleCredentialResponse(response) {
    console.log("Response.. :", response)   
    console.log("Encoded JWT ID token: " + response.credential);

    if (response.credential) {
        try {
            // Decode the JWT token to get user information
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            console.log("User ID:", payload.sub);
            console.log("User Name:", payload.name);
            console.log("User Email:", payload.email);
            console.log("User Image URL:", payload.picture);

            // Send the token to the backend for verification
            sendTokenToServer(response.credential);
        } catch (error) {
            console.error("Error decoding JWT token:", error);
        }
    } else {
        console.error("No credential received.");
    }
}

async function sendTokenToServer(id_token) {
    try {
        const response = await fetch('/tokenGoogleAuth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: id_token })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Authentication successful!");
            window.location.href = 'main.html';
        } else {
            console.error('Authentication failed');
            alert('Authentication failed');
        }
    } catch (error) {
        console.error('Error during token verification:', error);
        alert('An error occurred during authentication');
    }
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID",
        callback: handleCredentialResponse    
    });

    google.accounts.id.renderButton(
        document.getElementById("googlesignin"), 
        { theme: "outline", size: "large" }
    );

    google.accounts.id.prompt();
};

submit.addEventListener('click', async () => {
    const usernamePattern = /[^a-zA-Z0-9._]/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (username.value.length < 3 || username.value.length > 20) {
        alert("Username must be between 3 and 20 characters");
        return;
    }
    if (!emailPattern.test(email.value)) {
        alert("Invalid email format");
        return;
    }
    if (usernamePattern.test(username.value)) {
        alert("Username can only contain letters, numbers, dots, and underscores");
        return;
    }
    if (pass.value.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
    }
    
    const userData = { name: username.value, email: email.value, password: pass.value };
    
    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        
        if (response.ok && result.message === 'User created successfully!') {
            window.location.href = "login.html";
        }
        username.value = ''; email.value = ''; pass.value = '';
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

pass.addEventListener('blur', () => {
    if (pass.value.length >= 15) {
        alert("Warning: You may not be able to remember your password");
    }
});
