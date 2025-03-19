const loginButton = document.getElementById("login");
const username = document.getElementById("username");
const password = document.getElementById("password");
const twoFactorSection = document.getElementById("twoFactorSection");
const loginSection = document.getElementById("loginSection");
const verifyButton = document.getElementById("verifyCode");

loginButton.addEventListener('click', async () => {
    try {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailPattern.test(username.value);
        
        const loginData = {
            name: username.value,
            password: password.value,
            email: isEmail,
        };

        // Check if the 2FA token exists in the input field before sending the request
        const tokenInput = document.getElementById('twoFactorCode');
        if (tokenInput && tokenInput.value) {
            loginData.token = tokenInput.value;  // Include token if available
        }

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (response.status === 401 && data.requires2FA) {
            loginSection.style.display = 'none'; // Hide the login section
            document.getElementById('qrSection').style.display = 'block'; // Show 2FA section
            document.getElementById('qrCode').src = data.qrCodeUrl; // Display QR code for 2FA
        } else if (response.ok) {
            window.location.href = data.redirectUrl;
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('There was an error logging in.');
    }
});

// Handle the 2FA token verification
verifyButton.addEventListener('click', async () => {
    try {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailPattern.test(username.value);
        
        const loginData = {
            name: username.value,
            password: password.value,
            email: isEmail,
            token: document.getElementById('twoFactorCode').value // Get the token entered by the user
        };

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = data.redirectUrl; // Redirect to main page after successful login
        } else {
            alert(data.message);
            if (!data.requires2FA) {
                // If it's not a 2FA error, go back to the login section
                loginSection.style.display = 'block';
                twoFactorSection.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        alert('There was an error verifying your 2FA code.');
    }
});


const enable2FA = async () => {
    const response = await fetch('/2fa-enable', { method: 'POST' });
    const data = await response.json();
    // Display the QR code in an <img> tag or on the frontend
    document.getElementById('qrcode').src = data.qrCodeUrl;
  };
// Keep your existing redirect handlers
document.getElementById("signupRedirect").addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.getElementById("forgotPassword").addEventListener('click', () => {
    window.location.href = 'forgotpass.html';
});