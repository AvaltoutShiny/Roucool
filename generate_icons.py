#!/usr/bin/env python3
"""Generate PWA icons for Pidgey Hunt."""
import os, struct, zlib

def make_png(size, bird_color=(139, 94, 60), bg_color=(135, 206, 235)):
    """Create a simple PNG icon with a bird silhouette."""
    w = h = size
    # Draw pixel data
    pixels = []
    cx, cy = w // 2, h // 2
    r = w // 3

    for y in range(h):
        row = []
        for x in range(w):
            dx, dy = x - cx, y - cy
            # Body ellipse
            in_body = (dx/r)**2 + (dy/(r*0.75))**2 <= 1
            # Head circle (upper left)
            hx, hy = cx - r//2, cy - r//2
            in_head = (x-hx)**2 + (y-hy)**2 <= (r//2)**2
            # Eye
            ex, ey = hx - r//5, hy - r//8
            in_eye = (x-ex)**2 + (y-ey)**2 <= (r//8)**2

            if in_eye:
                row.extend([255, 255, 255, 255])  # white eye
            elif in_head or in_body:
                row.extend([*bird_color, 255])
            else:
                row.extend([*bg_color, 255])
        pixels.append(row)

    # Build PNG
    def pack_row(row_data):
        return b'\x00' + bytes(row_data)

    raw = b''.join(pack_row(r) for r in pixels)
    compressed = zlib.compress(raw, 9)

    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    return (
        b'\x89PNG\r\n\x1a\n' +
        chunk(b'IHDR', ihdr) +
        chunk(b'IDAT', compressed) +
        chunk(b'IEND', b'')
    )

os.makedirs('icons', exist_ok=True)
for size in [192, 512]:
    with open(f'icons/icon-{size}.png', 'wb') as f:
        f.write(make_png(size))
    print(f'Created icons/icon-{size}.png')

print('Icons generated successfully!')
