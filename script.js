const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const brightnessSlider = document.getElementById('brightness');
const contrastFactorSlider = document.getElementById('contrastFactor');
const brightnessValue = document.getElementById('brightness-value');
const contrastFactorValue = document.getElementById('contrastFactor-value');
const imageUrlInput = document.getElementById('image-url');
const loadUrlButton = document.getElementById('load-url');
const errorMessage = document.getElementById('error-message');
const urlInputSection = document.getElementById('url-input-section');

let originalImage = null;

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.style.borderColor = 'blue';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#ccc';
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.style.borderColor = '#ccc';
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    } else {
        const imageUrl = event.dataTransfer.getData('text/uri-list');
        if (imageUrl) {
            loadImageFromUrl(imageUrl);
        } else {
            showErrorMessage('Failed to load image from drop. Please enter the image URL.');
            urlInputSection.classList.remove('hidden');
        }
    }
});

loadUrlButton.addEventListener('click', () => {
    const imageUrl = imageUrlInput.value;
    if (imageUrl) {
        loadImageFromUrl(imageUrl);
    }
});

brightnessSlider.addEventListener('input', updateImage);
contrastFactorSlider.addEventListener('input', updateImage);

document.addEventListener('paste', (event) => {
    const items = (event.clipboardData || window.clipboardData).items;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            handleImageUpload(file);
            break;
        }
    }
});

function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            originalImage = img;
            updateImage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function loadImageFromUrl(url) {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // This is important for cross-origin images
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        originalImage = img;
        updateImage();
        clearErrorMessage();
    };

    img.onerror = () => {
        showErrorMessage('Failed to load image from URL. Trying to download...');
        downloadImageFromUrl(url);
    };

    img.src = url;
}

function downloadImageFromUrl(url) {
    fetch('/download-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: url })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showErrorMessage(data.error);
        } else {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                originalImage = img;
                updateImage();
                clearErrorMessage();
            };
            img.src = data.imagePath;
        }
    })
    .catch(error => {
        console.error('Error downloading image:', error);
        showErrorMessage('Failed to download and load image. Please try again.');
    });
}

function updateImage() {
    if (!originalImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const brightness = parseFloat(brightnessSlider.value);
    const contrastFactor = parseFloat(contrastFactorSlider.value);

    brightnessValue.textContent = brightness.toString();
    contrastFactorValue.textContent = contrastFactor.toString();

    // Apply brightness reduction
    for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * (1 - brightness);      // Red
        data[i + 1] = data[i + 1] * (1 - brightness);  // Green
        data[i + 2] = data[i + 2] * (1 - brightness);  // Blue
    }

    // Apply contrast factor
    for (let i = 0; i < data.length; i += 4) {
        data[i] = truncate(contrastFactor * (data[i] - 128) + 128);       // Red
        data[i + 1] = truncate(contrastFactor * (data[i + 1] - 128) + 128); // Green
        data[i + 2] = truncate(contrastFactor * (data[i + 2] - 128) + 128); // Blue
    }

    ctx.putImageData(imageData, 0, 0);
}

function truncate(value) {
    return Math.min(255, Math.max(0, value));
}

function showErrorMessage(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function clearErrorMessage() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    urlInputSection.classList.add('hidden');
}
