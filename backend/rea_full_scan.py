import os
import sys
import json
from collections import defaultdict

zen_path = r"C:\Program Files\Carl Zeiss\ZEN 2\ZEN 2 (blue edition)"
mtb_path = r"C:\Program Files\Carl Zeiss\MTB 2011 - 3.13.7.0"

def scan_directory(base_dir):
    binaries = []
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.dll', '.exe']:
                full = os.path.join(root, f)
                try:
                    size = os.path.getsize(full)
                    # Check if PE has CLI header (managed .NET)
                    is_managed = False
                    with open(full, 'rb') as fp:
                        header = fp.read(1024)
                        if b'PE\x00\x00' in header:
                            # Search for CLI metadata signature
                            fp.seek(0)
                            content = fp.read(min(size, 1024 * 64))
                            if b'BSJB' in content or b'#~' in content or b'#Strings' in content:
                                is_managed = True
                    binaries.append({
                        "name": f,
                        "path": full,
                        "relpath": os.path.relpath(full, base_dir),
                        "size": size,
                        "ext": ext,
                        "is_managed": is_managed
                    })
                except Exception as e:
                    pass
    return binaries

print(f"Scanning ZEN binaries at: {zen_path}")
zen_binaries = scan_directory(zen_path)
print(f"Scanning MTB hardware binaries at: {mtb_path}")
mtb_binaries = scan_directory(mtb_path)

total_zen_size = sum(b['size'] for b in zen_binaries) / (1024 * 1024)
total_mtb_size = sum(b['size'] for b in mtb_binaries) / (1024 * 1024)

managed_count = sum(1 for b in zen_binaries if b['is_managed'])
native_count = sum(1 for b in zen_binaries if not b['is_managed'])

print("\n--- SUMMARY ---")
print(f"ZEN Total Binaries: {len(zen_binaries)} ({total_zen_size:.2f} MB)")
print(f"  - Managed .NET Assemblies: {managed_count}")
print(f"  - Native C/C++ Binaries: {native_count}")
print(f"MTB Total Binaries: {len(mtb_binaries)} ({total_mtb_size:.2f} MB)")

# Categorize ZEN assemblies by namespace / domain
categories = defaultdict(list)
for b in zen_binaries:
    name = b['name'].lower()
    if 'acquisition' in name:
        categories['Acquisition & Experiment'].append(b)
    elif 'analyz' in name or 'amp' in name:
        categories['Image Analysis & AI'].append(b)
    elif 'camera' in name or 'mcam' in name or 'genicam' in name:
        categories['Camera & Detector Drivers'].append(b)
    elif 'storage' in name or 'bioformats' in name or 'czi' in name:
        if 'bioformats' in name or 'storage' in name or 'czi' in name:
            categories['File Formats & Storage'].append(b)
    elif 'hardware' in name or 'stage' in name or 'mtb' in name:
        categories['Hardware & Motion Control'].append(b)
    elif 'python' in name or 'grpc' in name or 'script' in name:
        categories['Automation & Scripting APIs'].append(b)
    elif 'gui' in name or 'ui' in name or 'view' in name or 'display' in name:
        categories['UI & Visualization'].append(b)
    elif 'licens' in name or 'dongle' in name:
        categories['Licensing (DRM)'].append(b)
    else:
        categories['Core & Infrastructure'].append(b)

print("\n--- FUNCTIONAL BREAKDOWN ---")
for cat, items in sorted(categories.items()):
    cat_size = sum(i['size'] for i in items) / (1024 * 1024)
    print(f"• {cat}: {len(items)} files ({cat_size:.2f} MB)")
    for i in sorted(items, key=lambda x: -x['size'])[:5]:
        kind = ".NET" if i['is_managed'] else "Native"
        print(f"   - [{kind}] {i['name']} ({i['size'] / 1024:.1f} KB)")

# Save full inventory to JSON
output_data = {
    "summary": {
        "zen_count": len(zen_binaries),
        "zen_mb": total_zen_size,
        "managed_count": managed_count,
        "native_count": native_count,
        "mtb_count": len(mtb_binaries),
        "mtb_mb": total_mtb_size
    },
    "categories": {cat: [b['name'] for b in items] for cat, items in categories.items()}
}

with open(r"c:\Users\testm\Documents\antigravity stuff\eyeview\backend\zen_inventory.json", "w") as fp:
    json.dump(output_data, fp, indent=2)

print("\nInventory saved to backend/zen_inventory.json")
