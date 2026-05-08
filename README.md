# Adaptive RestoreGAN for Histopathology Image Enhancement

## Overview
This project focuses on enhancing degraded histopathology images using an Adaptive RestoreGAN model. The system detects blurred images using the Variance of Laplacian method and enhances only low-quality images using GAN-based image restoration techniques.

## Features
- Blur Detection using Variance of Laplacian
- GAN-based Image Enhancement
- Adaptive Restoration Mechanism
- PSNR and SSIM Evaluation
- FastAPI Backend
- React Frontend

## Technologies Used
- Python
- PyTorch
- OpenCV
- FastAPI
- React
- NumPy

## Dataset Used
- PatchCamelyon (PCam)
- NCT-CRC-HE-100K

## Project Structure
backend/
frontend/
README.md

## How to Run

### Backend
```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

### Frontend
```bash
npm install
npm run dev
```

## Results
The model improves image clarity and restores structural details in degraded histopathology images while reducing unnecessary computation through adaptive enhancement.

## Future Scope
- Real-time medical image enhancement
- Integration with diagnostic systems
- Support for multiple medical imaging datasets
