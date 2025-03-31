const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');

// Rest of your variable declarations
const fileInput = document.getElementById('fileInput');
const changePicBtn = document.getElementById('changePicBtn');
const profilePreview = document.getElementById('profilePreview');
const cropModal = document.getElementById('cropModal');
const imageToCrop = document.getElementById('imageToCrop');
const cancelCrop = document.getElementById('cancelCrop');
const applyCrop = document.getElementById('applyCrop');
const done = document.getElementById("done");
const lightMode = document.getElementById("light");
const midnightMode = document.getElementById("midnight");
const infoIcon = document.getElementById('info-icon');
const tooltip = document.getElementById('tooltip');
const twofa = document.getElementById('2fa');
const deleteacc = document.getElementById("deleteacc");
const deleteConfirmForm = document.getElementById("deleteConfirmForm");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");
const getusername = document.getElementById("getusername");
const getuser = document.getElementById("getuser");
const gettag = document.getElementById("gettag");
const edituser = document.getElementById("edituser");
const edittag = document.getElementById("edittag");
const qrCode = document.getElementById("qrCode");
const dones = document.getElementById("dones");
// Toggle the visibility of the tooltip when the info icon is clicked
infoIcon.addEventListener('click', () => {
    const isVisible = tooltip.style.display === 'block';
    tooltip.style.display = isVisible ? 'none' : 'block';
});

dones.addEventListener('click', () => {
    document.getElementById('qrSection').style.display = 'none'; // Show 2FA section
});
function showContent() {
    loadingScreen.style.display = 'none';
    mainContent.style.display = 'block';
}

function forceRepaint() {
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
}
profilePreview.onerror = function() {
    // Replace with a data URI of a simple default avatar or adjust the path to your actual default image
    this.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="30" r="15" fill="#808080"/>
            <circle cx="40" cy="80" r="30" fill="#808080"/>
        </svg>
    `);
    this.onerror = null; // Prevents infinite loop if SVG fails
};

// Function to show content after loading


async function loadAppearances() {
    try {
        const response = await fetch('/appearances');
        const result = await response.json();

        if (result.light === true) {
            lightMode.classList.add('active');
            document.documentElement.style.setProperty('--bg-dark', '#FFFFFF');
            document.documentElement.style.setProperty('--card-dark', '#e6e6e6');
            document.documentElement.style.setProperty('--text-primary', '#1c1c1c');
            document.documentElement.style.setProperty('--text-secondary', '#0d0d0d');
            document.documentElement.style.setProperty('--border-color', '#9c9c9c');
            document.documentElement.style.setProperty('--accent-color', '#b0b0b0');
            document.documentElement.style.setProperty('--hover-color', '#c2c2c2');
        }

        if (result.midnight === true) {
            midnightMode.classList.add('active');
            document.documentElement.style.setProperty('--bg-dark', '#000000');
            document.documentElement.style.setProperty('--card-dark', '#080b0f');
            document.documentElement.style.setProperty('--text-primary', '#8c8c8c');
            document.documentElement.style.setProperty('--text-secondary', '#4d4d4d');
            document.documentElement.style.setProperty('--border-color', '#0d0d0d');
            document.documentElement.style.setProperty('--accent-color', '#141214');
            document.documentElement.style.setProperty('--hover-color', '#1c181c');
            document.documentElement.style.setProperty('--row', '#584a63');
        }

        if (result.twofac === true) {
            twofa.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading appearances:', error);
    } finally {
        // Always show content after attempt to load appearances
        showContent();
    }
}
async function loadProfilePicture() {
    try {
        const response = await fetch('/users');
        const userInfo = await response.json();

        if (userInfo.message === "Please Login First") {
            window.location.href = '/login.html';
            return;
        }

        const userResponse = await fetch('/user/profile');
        const userProfile = await userResponse.json();

        if (userResponse.ok) {
            profilePreview.src = userProfile.profilePicture || '/images/default-profile.png';
        } else {
            profilePreview.src = '/images/default-profile.png';
        }
    } catch (error) {
        console.error('Error loading profile picture:', error);
        profilePreview.src = '/images/default-profile.png';
    }
}

// Rest of your code remains the same...

// Initialize the page
async function initializePage() {
    await Promise.all([
        loadAppearances(),
        loadProfilePicture()
    ]);
}

initializePage();

twofa.addEventListener('click', async () => {
    const twofa = document.getElementById('2fa');
    twofa.classList.toggle('active');
    try{
        if (twofa.classList.contains('active')) {
            val = true
        }else{
            val = false
        }
        const set = {
            bool: val
        };

        const response = await fetch('/2fa-enable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },  
            body: JSON.stringify(set),
        })
        const data = await response.json();
        if (val) {
            qrCode.src = data.qrcodeUrl
            document.getElementById('qrSection').style.display = 'block'; // Show 2FA section
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error updating.');
    }
})
lightMode.addEventListener('click', async () => {
    const lightElement = document.getElementById('light');
    const midnightElement = document.getElementById('midnight');
    lightElement.classList.toggle('active');
    
    if (lightElement.classList.contains('active')) {
        midnightElement.classList.remove('active');
        try {
            const settings = {
                light: true,
                midnight: false
            };
            const response = await fetch('/updappearance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },  
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Updating failed.');
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            location.reload();
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error updating.');
        }
    } else {
        try {
            const settings = {
                light: false,
                midnight: false
            };
            const response = await fetch('/updappearance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },  
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Updating failed.');
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            document.documentElement.style.setProperty('--bg-dark', '#1E1E1E');
            document.documentElement.style.setProperty('--card-dark', '#1E1E1E');
            document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
            document.documentElement.style.setProperty('--text-secondary', '#B0B0B0');
            document.documentElement.style.setProperty('--border-color', '#3A3A3A');
            location.reload();
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error updating.');
        }
    }
});

midnightMode.addEventListener('click', async () => {
    const lightElement = document.getElementById('light');
    const midnightElement = document.getElementById('midnight');
    midnightElement.classList.toggle('active');
    
    if (midnightElement.classList.contains('active')) {
        lightElement.classList.remove('active');
        try {
            const settings = {
                light: false,
                midnight: true  
            };
            const response = await fetch('/updappearance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },  
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Updating failed.');
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            location.reload();
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error updating.');
        }
    } else {
        try {
            const settings = {
                light: false,
                midnight: false
            };
            const response = await fetch('/updappearance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },  
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Updating failed.');
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            document.documentElement.style.setProperty('--bg-dark', '#1E1E1E');
            document.documentElement.style.setProperty('--card-dark', '#1E1E1E');
            document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
            document.documentElement.style.setProperty('--text-secondary', '#B0B0B0');
            document.documentElement.style.setProperty('--border-color', '#3A3A3A');
            location.reload();
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error updating.');
        }
    }
});

done.addEventListener('click', () => {
    window.location.href = 'main.html';
});

let cropper;





fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('File is too large. Maximum size is 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            imageToCrop.src = e.target.result;
            cropModal.style.display = 'flex';

            if (cropper) {
                cropper.destroy();
            }

            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1,
                viewMode: 2, // Change to viewMode 2
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                modal: true,
                guides: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                responsive: true,
                checkCrossOrigin: false
            });
        };
        reader.readAsDataURL(file);
    }
});

cancelCrop.addEventListener('click', () => {
    cropModal.style.display = 'none';
    if (cropper) {
        cropper.destroy();
    }
    fileInput.value = '';
});

applyCrop.addEventListener('click', () => {
    cropper.getCroppedCanvas().toBlob(async (blob) => {
        const croppedFile = new File([blob], 'profile-pic.png', { type: 'image/png' });

        await uploadProfilePic(croppedFile);

        profilePreview.src = URL.createObjectURL(blob);
        cropModal.style.display = 'none';
        cropper.destroy();
        fileInput.value = '';

        location.reload();
    });
});

async function uploadProfilePic(file) {
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
        const response = await fetch('/upload-profile-pic', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Profile picture uploaded successfully');
        } else {
            console.error('Upload failed:', data.message);
            alert('Failed to upload profile picture');
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('Error uploading profile picture');
    }
}

// Add event listener for the 'changePicBtn' to open the file input
changePicBtn.addEventListener('click', () => {
    fileInput.click();
});

deleteacc.addEventListener("click", () => {
    deleteConfirmForm.style.display = "flex"; // Show the form
});

// Ensure event listeners are added only once
cancelDelete.addEventListener("click", () => {
    deleteConfirmForm.style.display = "none"; // Hide the form
});

confirmDelete.addEventListener("click", async () => {
    const password = document.getElementById("confirmPassword").value.trim();

    if (password === "") {
        alert("Please enter your password.");
        return;
    }
    const formData = {
        password: password
    }
    try {
        const response = await fetch('/deleteaccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Correct content type for JSON data
            },
            body: JSON.stringify(formData), // Send as JSON
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        if (response.ok) {
            deleteConfirmForm.style.display = "none";
            alert('Say goodnight baybee');
            window.location.href = "/login.html"
        } else {
            console.log(data.message)
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting:', error);
    }
});
edituser.addEventListener("click", async () =>{
    const usernamePattern = /[^a-zA-Z0-9._]/;
    const newContent = prompt('Enter your new name');
    if (newContent.length <= 3 || newContent.length >= 20) {
        alert("Username must be > 3 and < 20");
    }else if (usernamePattern.test(newContent) === true) {
        alert("No special characters are allowed for username, except . and _")
    }else{
        try {
            const response = await fetch('/changeuser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newContent })
            });
            const data = await response.json();
            alert(data.message)
        } catch (error) {
            console.error('Error changing user:', error);
        }
    }
})
edittag.addEventListener("click", async () =>{
    const newContent = prompt('Enter your new tag');
    if (!/^\d+$/.test(newContent) || newContent.length != 4) {
        alert("Tag must only be Numbers and has the exact length of 4");
    }else{
        try {
            const response = await fetch('/changetag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag: newContent })
            });
            const data = await response.json();
            alert(data.message)
        } catch (error) {
            console.error('Error changing user:', error);
        }
    }
})

async function fetching() {
    try {
        const response = await fetch('/users', { credentials: 'same-origin' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        getusername.textContent = `Username:  ${result.name}`;
        getuser.textContent = `DisplayName:  ${result.displayName}`;
        gettag.textContent = `Tag:  ${result.tag}`;
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

fetching()