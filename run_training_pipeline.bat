@echo off
REM MRI Contrast Enhancement - Complete Training Pipeline
REM This script runs the complete pipeline: preprocessing, training, and evaluation

echo ==========================================
echo MRI Contrast Enhancement Training Pipeline
echo ==========================================
echo.

REM Step 1: Preprocess data
echo Step 1/3: Preprocessing dataset...
python preprocess_data.py --data_root . --output_root preprocessed_data --train_split 0.8 --axis 2

if errorlevel 1 (
    echo Error: Preprocessing failed!
    exit /b 1
)

echo.
echo Step 2/3: Training model...
python train.py --data_dir preprocessed_data --epochs 100 --batch_size 16 --learning_rate 0.0001 --img_size 256 --model_path best_model.h5

if errorlevel 1 (
    echo Error: Training failed!
    exit /b 1
)

echo.
echo Step 3/3: Evaluating model...
python evaluate.py --model_path best_model.h5 --data_dir preprocessed_data --output_dir evaluation_results

if errorlevel 1 (
    echo Error: Evaluation failed!
    exit /b 1
)

echo.
echo ==========================================
echo Pipeline completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Check evaluation_results\ for visualizations
echo 2. Run the Flask app: python app.py
echo 3. Access the web application at http://localhost:5000
echo.

pause

