import cv2
import os
import sys
import glob

def find_latest_video(search_dir):
    video_extensions = ('*.mp4', '*.mov', '*.mkv', '*.webm', '*.avi', '*.3gp')
    video_files = []
    for ext in video_extensions:
        video_files.extend(glob.glob(os.path.join(search_dir, '**', ext), recursive=True))
        video_files.extend(glob.glob(os.path.join(search_dir, ext)))
    
    # Deduplicate and sort by modification time (latest first)
    video_files = list(set(video_files))
    if not video_files:
        return None
    video_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return video_files[0]

def extract_clean_frames(video_path, output_dir, fps_sample=2.0, blur_threshold=60.0):
    """
    Extracts frames from video:
    - fps_sample: how many frames to sample per second (e.g., 2 frames per sec = every 0.5s)
    - blur_threshold: Laplacian variance to filter out blurry frames while scrolling
    """
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Tidak dapat membuka video {video_path}")
        return []

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / video_fps
    
    print(f"Video Info:")
    print(f"- File: {os.path.basename(video_path)}")
    print(f"- Durasi: {duration_sec:.1f} detik ({total_frames} total frames @ {video_fps:.1f} fps)")
    print(f"- Sampling: 1 frame setiap {1/fps_sample:.2f} detik")
    
    frame_interval = max(1, int(video_fps / fps_sample))
    
    saved_frames = []
    frame_idx = 0
    saved_count = 0
    
    prev_gray = None

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_idx % frame_interval == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Check blurriness using Laplacian variance
            lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Check frame difference to avoid saving exact duplicate frozen screens
            is_different = True
            if prev_gray is not None:
                # Absolute difference
                diff = cv2.absdiff(gray, prev_gray)
                mean_diff = diff.mean()
                if mean_diff < 1.0: # Identical frame (screen did not move)
                    is_different = False
            
            if is_different and lap_var >= blur_threshold:
                time_sec = frame_idx / video_fps
                out_name = f"frame_{saved_count+1:04d}_{time_sec:.1f}s.png"
                out_path = os.path.join(output_dir, out_name)
                cv2.imwrite(out_path, frame)
                saved_frames.append(out_path)
                saved_count += 1
                prev_gray = gray
            elif is_different:
                # Even if slightly lower sharpness, save if we haven't saved in a while
                time_sec = frame_idx / video_fps
                out_name = f"frame_{saved_count+1:04d}_{time_sec:.1f}s.png"
                out_path = os.path.join(output_dir, out_name)
                cv2.imwrite(out_path, frame)
                saved_frames.append(out_path)
                saved_count += 1
                prev_gray = gray
                
        frame_idx += 1
        
    cap.release()
    print(f"\nSelesai! Berhasil mengekstrak {len(saved_frames)} frame bersih ke: {output_dir}")
    return saved_frames

if __name__ == '__main__':
    search_root = os.path.join(os.path.dirname(__file__), '..', 'screenshot alamat paket')
    
    video_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not video_path:
        video_path = find_latest_video(search_root)
        
    if not video_path:
        print(f"Belum ada file video ditemukan di folder: {search_root}")
        print("Silakan taruh file video (.mp4 / .mov / .mkv) di folder tersebut.")
        sys.exit(1)
        
    out_dir = os.path.join(search_root, 'video_frames')
    extract_clean_frames(video_path, out_dir)
