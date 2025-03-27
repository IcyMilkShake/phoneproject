// login.js
const username = document.getElementById("username");
const pass = document.getElementById("password");
const email = document.getElementById("email");
const submit = document.getElementById("submit");

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
        // Send the token to your server for verification
        const response = await fetch('/tokenGoogleAuth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: id_token })
        });

        const data = await response.json();

        // Check if authentication was successful
        if (response.ok) {
            console.log("Authentication successful!");
            // Redirect to a different page after successful login
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
        client_id: "764440109211-519r5j9m6cfh1ovuiu0vujo0f2ufaldg.apps.googleusercontent.com",
        callback: handleCredentialResponse    
    });

    google.accounts.id.renderButton(
        document.getElementById("googlesignin"), 
        { theme: "outline", size: "large" }
    );

    google.accounts.id.prompt(); // Triggers One Tap automatically
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
