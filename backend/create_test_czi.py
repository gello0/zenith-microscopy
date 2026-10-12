import os
import numpy as np
from pylibCZIrw import czi

output_czi = r"c:\Users\testm\Documents\antigravity stuff\eyeview\backend\test_sample_4ch_zstack.czi"

print(f"Generating authentic Zeiss .czi file at: {output_czi}")

width = 512
height = 512
num_channels = 4
num_z = 5
num_t = 3

with czi.create_czi(output_czi, exist_ok=True) as writer:
    for t in range(num_t):
        for z in range(num_z):
            for c in range(num_channels):
                # Synthesize 16-bit microscope data plane
                plane_data = np.zeros((height, width, 1), dtype=np.uint16)
                
                # Add background intensity
                plane_data += np.random.randint(100, 300, (height, width, 1), dtype=np.uint16)
                
                # Add circular cell structure centered in image
                y, x = np.ogrid[:height, :width]
                dist_from_center = np.sqrt((x - 256)**2 + (y - 256)**2)
                
                if c == 0: # DAPI
                    mask = dist_from_center < 70
                    plane_data[mask, 0] += np.uint16(32000 / (1 + abs(z - 2)))
                elif c == 1: # Alexa 488 (Tubulin)
                    mask = (dist_from_center > 40) & (dist_from_center < 160)
                    plane_data[mask, 0] += np.uint16(24000 / (1 + abs(z - 2)))
                elif c == 2: # mCherry (Actin)
                    mask = (dist_from_center > 140) & (dist_from_center < 180)
                    plane_data[mask, 0] += np.uint16(28000 / (1 + abs(z - 2)))
                elif c == 3: # Cy5 (Mitochondria)
                    puncta = (np.random.random((height, width, 1)) > 0.98) & (dist_from_center[..., None] < 150)
                    plane_data[puncta] += np.uint16(45000 / (1 + abs(z - 2)))

                writer.write(plane_data, plane={"C": c, "Z": z, "T": t})

print("Successfully written .czi file!")

# Verify by reading back
with czi.open_czi(output_czi) as reader:
    print(f"Verification: CZI Bounding Box: {reader.total_bounding_box}")
    print(f"Verification: Pixel Type: {reader.pixel_type}")
    print(f"Verification: Reader Scenes: {reader.scenes_bounding_rectangle}")
