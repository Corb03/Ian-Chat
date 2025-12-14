import os
from PIL import Image

# Folder with your original avatars
source_folder = 'static/missing avatars'
target_folder = os.path.join(source_folder, 'renamed')

# Create the output folder if it doesn't exist
os.makedirs(target_folder, exist_ok=True)

# Supported image extensions
image_exts = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'}

# Get list of image files
images = sorted(
    f for f in os.listdir(source_folder)
    if os.path.splitext(f)[1].lower() in image_exts
)

# Copy and rename to renamed/1.png, 2.png, etc.
for i, filename in enumerate(images, start=1):
    original_path = os.path.join(source_folder, filename)
    new_path = os.path.join(target_folder, f"{i}.png")

    try:
        img = Image.open(original_path).convert("RGBA")
        img.save(new_path, "PNG")
        print(f"Copied and renamed: {filename} → {i}.png")
    except Exception as e:
        print(f"Failed to convert {filename}: {e}")