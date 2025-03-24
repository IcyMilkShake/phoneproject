// login.js
const username = document.getElementById("username");
const pass = document.getElementById("password");
const email = document.getElementById("email");
const submit = document.getElementById("submit");

// Callback function to handle Google Sign-In response
function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    
    try {
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        console.log("User ID:", payload.sub);
        console.log("User Name:", payload.name);
        console.log("User Email:", payload.email);
        console.log("User Image URL:", payload.picture);
    
        // Send the token to your backend for verification
        sendTokenToServer(response.credential);
    } catch (error) {
        console.error("Error decoding JWT token:", error);
    }
}

// Function to send the token to the backend
async function sendTokenToServer(id_token) {
    try {
        const response = await fetch('/tokenGoogleAuth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: id_token })
        });
        const data = await response.json();
        console.log('Server Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

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
