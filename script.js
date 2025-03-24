const username = document.getElementById("username");
const pass = document.getElementById("password");
const email = document.getElementById("email");
const submit = document.getElementById("submit");
const google = document.getElementById("google");

google.addEventListener('click', async () => {
    var profile = googleUser.getBasicProfile();
    var userId = profile.getId();
    var userName = profile.getName();
    var userEmail = profile.getEmail();
    var userImage = profile.getImageUrl();

    console.log("User ID: " + userId);
    console.log("User Name: " + userName);
    console.log("User Email: " + userEmail);
    console.log("User Image URL: " + userImage);

    // Get the ID token (you will need this for server-side authentication)
    var id_token = googleUser.getAuthResponse().id_token;

    // Send the ID token to your server for verification
    sendTokenToServer(id_token);
})

function sendTokenToServer(id_token) {
    // Example: Send the token to your server using AJAX or Fetch
    fetch('/tokenGoogleAuth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: id_token })
    })
    .then(response => response.json())
    .then(data => console.log('Server Response:', data))
    .catch(error => console.error('Error:', error));
}

submit.addEventListener('click', async () => {
    const usernamePattern = /[^a-zA-Z0-9._]/; // Matches any character that is not a letter, number, dot, or underscore
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (username.value.length <= 3 || username.value.length >= 20) {
        alert("Username must be > 3 and < 20");
        return
    } else if (emailPattern.test(email.value) === false) {
        alert("Please enter the correct email format")
        return
    } else if (usernamePattern.test(username.value) == true){
        alert("No special characters are allowed for username, except . and _")
    } else if (pass.value.length <= 5) {
        alert("Password must be at least 6 letters long");
        return
    }

    const userData = {
        name: username.value,
        email: email.value,
        password: pass.value,
    };

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.message == 'User created successfully!') {
            window.location.href = "login.html"
        }
        username.value = ''; // Clear username input
        email.value = ''; // Clear username input
        pass.value = ''; // Clear password input
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

pass.addEventListener('blur', () => {
    if (pass.value.length >= 15) {
        alert("Warning: You may not be able to remember your password");
    }
});
