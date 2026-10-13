"""
Data Preprocessing Script
Converts NIfTI MRI scans to PNG slices for training
"""

import os
import numpy as np
import nibabel as nib
from PIL import Image
from tqdm import tqdm
import argparse
from pathlib import Path
import shutil

def normalize_image(img):
    """Normalize image to 0-255 range"""
    img_min = np.min(img)
    img_max = np.max(img)
    if img_max > img_min:
        img = ((img - img_min) / (img_max - img_min)) * 255.0
    return img.astype(np.uint8)

def extract_slices_from_nifti(nifti_path, output_dir, prefix, axis=2):
    """
    Extract 2D slices from 3D NIfTI volume
    
    Args:
        nifti_path: Path to NIfTI file
        output_dir: Directory to save PNG slices
        prefix: Prefix for output filenames
        axis: Axis along which to extract slices (0=sagittal, 1=coronal, 2=axial)
    """
    try:
        nii_img = nib.load(nifti_path)
        data = nii_img.get_fdata()
        
        # Extract slices along specified axis
        num_slices = data.shape[axis]
        slices = []
        
        for i in range(num_slices):
            if axis == 0:
                slice_data = data[i, :, :]
            elif axis == 1:
                slice_data = data[:, i, :]
            else:  # axis == 2 (axial)
                slice_data = data[:, :, i]
            
            # Skip slices with no information
            if np.sum(slice_data) == 0:
                continue
            
            # Normalize and convert to uint8
            slice_normalized = normalize_image(slice_data)
            
            # Convert to PIL Image and save
            img = Image.fromarray(slice_normalized, mode='L')  # Grayscale
            filename = f"{prefix}_slice_{i:03d}.png"
            filepath = os.path.join(output_dir, filename)
            img.save(filepath)
            slices.append((i, filepath))
        
        return slices
    except Exception as e:
        print(f"Error processing {nifti_path}: {str(e)}")
        return []

def preprocess_dataset(data_root, output_root, train_split=0.8, axis=2):
    """
    Preprocess entire dataset
    
    Args:
        data_root: Root directory containing patient folders
        output_root: Root directory for preprocessed data
        train_split: Fraction of data for training
        axis: Axis for slice extraction
    """
    # Create output directories
    train_input_dir = os.path.join(output_root, 'train', 'input')
    train_target_dir = os.path.join(output_root, 'train', 'target')
    test_input_dir = os.path.join(output_root, 'test', 'input')
    test_target_dir = os.path.join(output_root, 'test', 'target')
    
    for dir_path in [train_input_dir, train_target_dir, test_input_dir, test_target_dir]:
        os.makedirs(dir_path, exist_ok=True)
    
    # Get all patient directories
    patient_dirs = [d for d in os.listdir(data_root) 
                   if os.path.isdir(os.path.join(data_root, d)) and d.startswith('1002')]
    patient_dirs.sort()
    
    print(f"Found {len(patient_dirs)} patient directories")
    
    # Split into train and test
    split_idx = int(len(patient_dirs) * train_split)
    train_patients = patient_dirs[:split_idx]
    test_patients = patient_dirs[split_idx:]
    
    print(f"Training patients: {len(train_patients)}, Test patients: {len(test_patients)}")
    
    # Process training set
    print("\nProcessing training set...")
    train_pairs = []
    for patient_id in tqdm(train_patients):
        patient_dir = os.path.join(data_root, patient_id)
        
        # Find T1pre and T1post files
        t1pre_file = None
        t1post_file = None
        
        for file in os.listdir(patient_dir):
            if 'T1pre' in file and file.endswith('.nii.gz'):
                t1pre_file = os.path.join(patient_dir, file)
            elif 'T1post' in file and file.endswith('.nii.gz'):
                t1post_file = os.path.join(patient_dir, file)
        
        if t1pre_file and t1post_file:
            # Extract slices
            input_slices = extract_slices_from_nifti(
                t1pre_file, train_input_dir, patient_id, axis
            )
            target_slices = extract_slices_from_nifti(
                t1post_file, train_target_dir, patient_id, axis
            )
            
            # Match slices by index
            input_dict = {idx: path for idx, path in input_slices}
            target_dict = {idx: path for idx, path in target_slices}
            
            common_indices = set(input_dict.keys()) & set(target_dict.keys())
            for idx in common_indices:
                train_pairs.append({
                    'input': input_dict[idx],
                    'target': target_dict[idx],
                    'patient': patient_id,
                    'slice': idx
                })
    
    # Process test set
    print("\nProcessing test set...")
    test_pairs = []
    for patient_id in tqdm(test_patients):
        patient_dir = os.path.join(data_root, patient_id)
        
        # Find T1pre and T1post files
        t1pre_file = None
        t1post_file = None
        
        for file in os.listdir(patient_dir):
            if 'T1pre' in file and file.endswith('.nii.gz'):
                t1pre_file = os.path.join(patient_dir, file)
            elif 'T1post' in file and file.endswith('.nii.gz'):
                t1post_file = os.path.join(patient_dir, file)
        
        if t1pre_file and t1post_file:
            # Extract slices
            input_slices = extract_slices_from_nifti(
                t1pre_file, test_input_dir, patient_id, axis
            )
            target_slices = extract_slices_from_nifti(
                t1post_file, test_target_dir, patient_id, axis
            )
            
            # Match slices by index
            input_dict = {idx: path for idx, path in input_slices}
            target_dict = {idx: path for idx, path in target_slices}
            
            common_indices = set(input_dict.keys()) & set(target_dict.keys())
            for idx in common_indices:
                test_pairs.append({
                    'input': input_dict[idx],
                    'target': target_dict[idx],
                    'patient': patient_id,
                    'slice': idx
                })
    
    # Save pair information
    import json
    pairs_info = {
        'train': train_pairs,
        'test': test_pairs
    }
    
    pairs_file = os.path.join(output_root, 'pairs_info.json')
    with open(pairs_file, 'w') as f:
        json.dump(pairs_info, f, indent=2)
    
    print(f"\nPreprocessing complete!")
    print(f"Training pairs: {len(train_pairs)}")
    print(f"Test pairs: {len(test_pairs)}")
    print(f"Pairs info saved to: {pairs_file}")
    
    return train_pairs, test_pairs

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Preprocess MRI dataset')
    parser.add_argument('--data_root', type=str, default='.', 
                       help='Root directory containing patient folders')
    parser.add_argument('--output_root', type=str, default='preprocessed_data',
                       help='Output directory for preprocessed data')
    parser.add_argument('--train_split', type=float, default=0.8,
                       help='Fraction of data for training')
    parser.add_argument('--axis', type=int, default=2,
                       help='Axis for slice extraction (0=sagittal, 1=coronal, 2=axial)')
    
    args = parser.parse_args()
    
    preprocess_dataset(args.data_root, args.output_root, args.train_split, args.axis)

