import cv2
import os

video_path = 'screenshot alamat paket/28 November 2026/Recording-2026-11-28-093839.mp4'
output_dir = 'screenshot alamat paket/28 November 2026/extracted_frames'
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f"Total frames: {total_frames}, FPS: {fps}, Duration: {total_frames/fps:.1f}s", flush=True)

# 0.4s window, check every 4 frames, pick sharpest frame
window_size = max(1, int(fps * 0.4))
saved_count = 0
prev_saved_gray = None
total_windows = int(total_frames / window_size) + 1

for w_idx in range(total_windows):
    start_frame = w_idx * window_size
    if start_frame >= total_frames:
        break
    best_frame = None
    best_sharpness = -1
    best_frame_no = start_frame

    for f_offset in range(0, window_size, 4):
        curr_frame_no = start_frame + f_offset
        if curr_frame_no >= total_frames:
            break
        cap.set(cv2.CAP_PROP_POS_FRAMES, curr_frame_no)
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()

        if sharpness > best_sharpness:
            best_sharpness = sharpness
            best_frame = frame
            best_frame_no = curr_frame_no

    if best_frame is not None:
        gray_best = cv2.cvtColor(best_frame, cv2.COLOR_BGR2GRAY)
        if prev_saved_gray is not None:
            diff = cv2.absdiff(gray_best, prev_saved_gray).mean()
            if diff < 1.3:
                continue

        time_sec = best_frame_no / fps
        out_name = f"frame_{saved_count+1:04d}_sec_{time_sec:05.1f}.png"
        cv2.imwrite(os.path.join(output_dir, out_name), best_frame)
        prev_saved_gray = gray_best
        saved_count += 1

cap.release()
print(f"Extracted {saved_count} unique sharp frames into {output_dir}", flush=True)
