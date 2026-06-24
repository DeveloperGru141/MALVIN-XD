import subprocess
import os
import sys

project_dir = "C:\\Users\\ADEMOLA\\Projects\\Ademola-xd"
os.chdir(project_dir)

print("🐳 Building Docker image for ademola-xd...")

# Run docker build
result = subprocess.run(['docker', 'build', '-t', 'ademola-xd', '.'], 
                       capture_output=True, text=True)

if result.returncode == 0:
    print("✅ Docker image built successfully!")
    
    # List images
    print("\n📋 Images containing ademola-xd:")
    images = subprocess.run(['docker', 'images'], capture_output=True, text=True)
    for line in images.stdout.split('\n'):
        if 'ademola-xd' in line:
            print(f"  {line}")
else:
    print("❌ Docker build failed:")
    print(result.stderr)
    sys.exit(1)
