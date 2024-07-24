const dropZone = document.getElementById('drop-zone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const brightnessSlider = document.getElementById('brightness');
const contrastFactorSlider = document.getElementById('contrastFactor');
const brightnessValue = document.getElementById('brightness-value');
const contrastFactorValue = document.getElementById('contrastFactor-value');
const pasteImageButton = document.getElementById('paste-image-button');

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
    }
});

pasteImageButton.addEventListener('click', () => {
    navigator.clipboard.read().then(items => {
        for (const item of items) {
            if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                item.getType(item.types.find(type => type.startsWith('image/'))).then(blob => {
                    const file = new File([blob], 'pasted_image.png', { type: blob.type });
                    handleImageUpload(file);
                });
                break;
            }
        }
    }).catch(err => {
        console.error('Error reading clipboard:', err);
    });
});

brightnessSlider.addEventListener('input', updateImage);
contrastFactorSlider.addEventListener('input', updateImage);

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
