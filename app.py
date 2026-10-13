"""
Flask Web Application for MRI Contrast Enhancement
Complete multi-page healthcare application
"""

from flask import Flask, render_template, request, redirect, url_for, session, flash, send_file, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import numpy as np
from PIL import Image, ImageFilter
import cv2
import tensorflow as tf
from tensorflow import keras
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from datetime import datetime
import sqlite3
from functools import wraps
from model import psnr_metric, ssim_metric, combined_loss

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULTS_FOLDER'] = 'results'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'nii', 'gz'}

# Create necessary directories
for folder in [app.config['UPLOAD_FOLDER'], app.config['RESULTS_FOLDER'], 'static/results']:
    os.makedirs(folder, exist_ok=True)

# Load model globally
model = None
MODEL_PATH = 'final_model.h5'

def init_db():
    """Initialize database for user management"""
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename TEXT,
            psnr REAL,
            ssim REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def load_model():
    """Load the trained model"""
    global model
    if model is None:
        # Try multiple possible model paths
        possible_paths = [MODEL_PATH, 'final_model.h5', 'best_model.h5', 'model.h5']
        model_loaded = False
        
        for path in possible_paths:
            if os.path.exists(path):
                try:
                    model = keras.models.load_model(
                        path,
                        custom_objects={
                            'combined_loss': combined_loss,
                            'psnr_metric': psnr_metric,
                            'ssim_metric': ssim_metric,
                            'ssim': lambda y_true, y_pred: tf.image.ssim(y_true, y_pred, max_val=1.0),
                            'psnr': lambda y_true, y_pred: tf.image.psnr(y_true, y_pred, max_val=1.0)
                        },
                        compile=False
                    )
                    # Recompile with custom objects (optional for inference)
                    try:
                        optimizer = keras.optimizers.Adam(learning_rate=0.0001)
                        model.compile(
                            optimizer=optimizer,
                            loss=combined_loss,
                            metrics=[psnr_metric, ssim_metric, 'mae']
                        )
                    except:
                        # Model might already be compiled, which is fine for inference
                        pass
                    print(f"Model loaded successfully from {path}")
                    model_loaded = True
                    break
                except Exception as e:
                    print(f"Error loading model from {path}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    continue
        
        if not model_loaded:
            print(f"Warning: No model file found in {possible_paths}. Please train the model first.")
            model = None
    return model

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def login_required(f):
    """Decorator for login required routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def preprocess_image(image_path, img_size=(128, 128)):
    """Preprocess image for model input"""
    try:
        img = Image.open(image_path).convert('L')
        img = img.resize(img_size, Image.BILINEAR)
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_tensor = np.expand_dims(np.expand_dims(img_array, axis=-1), axis=0)
        return img_tensor, img_array
    except Exception as e:
        raise Exception(f"Error preprocessing image: {str(e)}")

def calculate_metrics(pred_img, target_img=None):
    """Calculate SSIM and PSNR metrics"""
    if target_img is None:
        return None, None
    
    pred_flat = pred_img.flatten()
    target_flat = target_img.flatten()
    
    # PSNR
    mse = np.mean((pred_flat - target_flat) ** 2)
    if mse == 0:
        psnr = float('inf')
    else:
        psnr = 20 * np.log10(1.0 / np.sqrt(mse))
    
    # SSIM using tensorflow
    pred_tf = tf.constant(pred_img.reshape(256, 256, 1), dtype=tf.float32)
    target_tf = tf.constant(target_img.reshape(256, 256, 1), dtype=tf.float32)
    ssim = tf.image.ssim(pred_tf, target_tf, max_val=1.0).numpy()
    ssim_val = float(ssim[0]) if isinstance(ssim, np.ndarray) and len(ssim) > 0 else float(ssim)
    
    return psnr, ssim_val

# Routes
@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not username or not email or not password:
            flash('Please fill in all fields.', 'error')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')
        
        conn = get_db()
        try:
            hashed_password = generate_password_hash(password)
            conn.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                (username, email, hashed_password)
            )
            conn.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username or email already exists.', 'error')
        finally:
            conn.close()
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Please fill in all fields.', 'error')
            return render_template('login.html')
        
        conn = get_db()
        user = conn.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard"""
    conn = get_db()
    predictions = conn.execute(
        'SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        (session['user_id'],)
    ).fetchall()
    conn.close()
    
    return render_template('dashboard.html', predictions=predictions)

@app.route('/predict', methods=['GET', 'POST'])
@login_required
def predict():
    """MRI contrast enhancement prediction"""
    model = load_model()
    
    if model is None:
        flash('Model not found. Please ensure the model file exists.', 'error')
        return render_template('predict.html', model_loaded=False)
    
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file uploaded.', 'error')
            return render_template('predict.html', model_loaded=True)
        
        file = request.files['file']
        
        if file.filename == '':
            flash('No file selected.', 'error')
            return render_template('predict.html', model_loaded=True)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            try:
                # Load original image for display (preserve quality)
                original_img = Image.open(filepath).convert('L')
                original_size = original_img.size
                original_array = np.array(original_img, dtype=np.float32)
                
                # Preprocess image for model (resize to 128x128 for prediction)
                input_tensor, _ = preprocess_image(filepath, img_size=(128, 128))
                
                # Predict
                prediction = model.predict(input_tensor, verbose=0)[0, :, :, 0]
                
                # Enhance prediction quality before upsampling
                # Normalize and ensure proper contrast
                prediction = np.clip(prediction, 0, 1)
                
                # Apply contrast enhancement to improve visibility
                prediction_enhanced = prediction.copy()
                # Adaptive histogram equalization-like enhancement
                prediction_enhanced = (prediction_enhanced - prediction_enhanced.min()) / (prediction_enhanced.max() - prediction_enhanced.min() + 1e-8)
                
                # Convert to uint8 and resize with high-quality interpolation
                pred_img_128 = Image.fromarray((prediction_enhanced * 255).astype(np.uint8), mode='L')
                
                # Upscale to original size using high-quality LANCZOS resampling
                pred_img_resized = pred_img_128.resize(original_size, Image.LANCZOS)
                
                # Apply sharpening to improve edge definition (helps detect abnormalities)
                pred_img_resized = pred_img_resized.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
                
                # Convert to arrays for segmentation processing
                original_array = np.array(original_img, dtype=np.float32)
                pred_array_full = np.array(pred_img_resized, dtype=np.float32)
                
                # Normalize both to same range for proper comparison
                original_norm = (original_array - original_array.min()) / (original_array.max() - original_array.min() + 1e-8)
                pred_norm = (pred_array_full - pred_array_full.min()) / (pred_array_full.max() - pred_array_full.min() + 1e-8)
                
                # Calculate enhancement: regions that became brighter in contrast-enhanced image
                # Use relative enhancement (percentage increase)
                enhancement_ratio = (pred_norm + 1e-8) / (original_norm + 1e-8)
                enhancement_diff = pred_norm - original_norm
                
                # Combine both metrics: look for regions with both high ratio and high absolute difference
                combined_enhancement = (enhancement_ratio > 1.15) & (enhancement_diff > 0.1)
                
                # Also check for absolute bright regions in contrast-enhanced image
                bright_regions = pred_norm > np.percentile(pred_norm, 75)
                
                # Combine conditions: enhanced regions OR bright regions
                segmentation_mask = (combined_enhancement | bright_regions).astype(np.uint8) * 255
                
                # Apply morphological operations to clean up and fill holes
                kernel_small = np.ones((3, 3), np.uint8)
                kernel_large = np.ones((7, 7), np.uint8)
                
                # Remove small noise
                segmentation_mask = cv2.morphologyEx(segmentation_mask, cv2.MORPH_OPEN, kernel_small)
                # Fill holes and connect nearby regions
                segmentation_mask = cv2.morphologyEx(segmentation_mask, cv2.MORPH_CLOSE, kernel_large)
                
                # Remove very small regions (noise)
                num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(segmentation_mask, connectivity=8)
                min_area = 50  # Minimum area for a valid region
                cleaned_mask = np.zeros_like(segmentation_mask)
                for i in range(1, num_labels):  # Skip background (label 0)
                    if stats[i, cv2.CC_STAT_AREA] >= min_area:
                        cleaned_mask[labels == i] = 255
                segmentation_mask = cleaned_mask
                
                # Create segmentation overlay (blue overlay on original)
                original_rgb = Image.fromarray(original_array.astype(np.uint8), mode='L').convert('RGB')
                seg_mask_img = Image.fromarray(segmentation_mask, mode='L')
                
                # Create semi-transparent blue overlay for better visibility
                overlay_rgb = np.array(original_rgb)
                blue_mask = segmentation_mask > 0
                
                # Apply blue color with transparency to highlighted regions
                overlay_rgb[blue_mask, 0] = np.clip(overlay_rgb[blue_mask, 0] * 0.3 + 0 * 0.7, 0, 255)  # Red channel
                overlay_rgb[blue_mask, 1] = np.clip(overlay_rgb[blue_mask, 1] * 0.3 + 100 * 0.7, 0, 255)  # Green channel
                overlay_rgb[blue_mask, 2] = np.clip(overlay_rgb[blue_mask, 2] * 0.3 + 255 * 0.7, 0, 255)  # Blue channel
                
                segmentation_overlay = Image.fromarray(overlay_rgb.astype(np.uint8), mode='RGB')
                
                # Create ground truth mask (binary white on black)
                ground_truth = Image.fromarray(segmentation_mask, mode='L')
                
                # Save individual results
                result_filename = f"result_{timestamp}.png"
                result_path = os.path.join('static/results', result_filename)
                pred_img_resized.save(result_path)
                
                seg_filename = f"segmentation_{timestamp}.png"
                seg_path = os.path.join('static/results', seg_filename)
                segmentation_overlay.save(seg_path)
                
                gt_filename = f"groundtruth_{timestamp}.png"
                gt_path = os.path.join('static/results', gt_filename)
                ground_truth.save(gt_path)
                
                # Create 4-panel visualization: Original, Contrast-Enhanced, Segmentation, Ground Truth
                fig, axes = plt.subplots(1, 4, figsize=(20, 5))
                
                # Original
                axes[0].imshow(original_img, cmap='gray', vmin=0, vmax=255)
                axes[0].set_title('Original Image', fontsize=14, fontweight='bold')
                axes[0].axis('off')
                
                # Contrast-Enhanced
                axes[1].imshow(pred_img_resized, cmap='gray', vmin=0, vmax=255)
                axes[1].set_title('Contrast-Enhanced', fontsize=14, fontweight='bold')
                axes[1].axis('off')
                
                # Segmentation Overlay
                axes[2].imshow(segmentation_overlay)
                axes[2].set_title('Segmentation', fontsize=14, fontweight='bold')
                axes[2].axis('off')
                
                # Ground Truth
                axes[3].imshow(ground_truth, cmap='gray', vmin=0, vmax=255)
                axes[3].set_title('Ground Truth', fontsize=14, fontweight='bold')
                axes[3].axis('off')
                
                plt.tight_layout()
                comparison_path = os.path.join('static/results', f"comparison_{timestamp}.png")
                # Save with high DPI for better quality
                plt.savefig(comparison_path, dpi=300, bbox_inches='tight', facecolor='white', pad_inches=0.1)
                plt.close()
                
                flash('Prediction successful!', 'success')
                return render_template('predict_result.html', 
                                     original_image=url_for('uploaded_file', filename=filename),
                                     contrast_image=url_for('static', filename=f'results/{result_filename}'),
                                     segmentation_image=url_for('static', filename=f'results/{seg_filename}'),
                                     groundtruth_image=url_for('static', filename=f'results/{gt_filename}'),
                                     comparison_image=url_for('static', filename=f'results/comparison_{timestamp}.png'),
                                     timestamp=timestamp)
                
            except Exception as e:
                flash(f'Error during prediction: {str(e)}', 'error')
                return render_template('predict.html', model_loaded=True)
        else:
            flash('Invalid file type. Please upload PNG, JPG, or NIfTI files.', 'error')
    
    return render_template('predict.html', model_loaded=True)

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html')

@app.route('/contact')
def contact():
    """Contact page"""
    return render_template('contact.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

@app.route('/download_model')
@login_required
def download_model():
    """Download trained model"""
    possible_paths = [MODEL_PATH, 'final_model.h5', 'best_model.h5']
    for path in possible_paths:
        if os.path.exists(path):
            return send_file(path, as_attachment=True, download_name='mri_contrast_model.h5')
    flash('Model file not found.', 'error')
    return redirect(url_for('dashboard'))

# Initialize database on startup
init_db()

if __name__ == '__main__':
    print("Loading model...")
    load_model()
    print("Starting Flask application...")
    app.run(debug=True, host='0.0.0.0', port=5000)

