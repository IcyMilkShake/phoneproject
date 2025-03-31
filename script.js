const username = document.getElementById("username");
const pass = document.getElementById("password");
const email = document.getElementById("email");
const submit = document.getElementById("submit");
const tag = document.getElementById("tag");
const random = document.getElementById("random");

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

random.addEventListener("click", async () =>{
    if (!username.value) {
        alert("To Randomize a tag, Username field cannot be blank")
    }
    try {
        const user = username.value
        const response = await fetch("/availableNum", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        })
        const data = await response.json();
        tag.value = data.tag
    }catch(err) {
        console.log("Error randomizing: ",err)
    }
})
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
