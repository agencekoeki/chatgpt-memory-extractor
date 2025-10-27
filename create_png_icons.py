#!/usr/bin/env python3

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """Créer une icône avec un dégradé et un symbole de cerveau stylisé"""
    
    # Créer une nouvelle image avec fond transparent
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Couleurs du dégradé (du violet au pourpre)
    color1 = (102, 126, 234)  # #667eea
    color2 = (118, 75, 162)   # #764ba2
    
    # Créer un dégradé simple
    for y in range(size):
        # Interpolation linéaire entre les deux couleurs
        ratio = y / size
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b, 255))
    
    # Dessiner un cercle blanc au centre (représentant un cerveau stylisé)
    padding = size // 8
    circle_bbox = [padding, padding, size - padding, size - padding]
    draw.ellipse(circle_bbox, fill=(255, 255, 255, 230))
    
    # Ajouter un symbole "🧠" ou des lignes stylisées
    # Dessiner des courbes pour représenter les circonvolutions du cerveau
    center_x, center_y = size // 2, size // 2
    radius = (size - 2 * padding) // 2
    
    # Dessiner des lignes courbes
    draw.arc([padding + radius//3, padding + radius//3, 
              size - padding - radius//3, size - padding - radius//3], 
             0, 180, fill=(102, 126, 234, 200), width=max(1, size//32))
    
    draw.arc([padding + radius//2, padding + radius//4, 
              size - padding - radius//2, size - padding - radius//4], 
             180, 360, fill=(118, 75, 162, 200), width=max(1, size//32))
    
    # Sauvegarder l'image
    filename = f'icon{size}.png'
    img.save(filename, 'PNG')
    print(f"✅ Créé: {filename}")
    return filename

# Installer Pillow si nécessaire
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Installation de Pillow...")
    os.system("pip install Pillow --break-system-packages")
    from PIL import Image, ImageDraw

# Créer les trois tailles d'icônes requises
print("🎨 Création des icônes PNG...")
for size in [16, 48, 128]:
    create_icon(size)

print("\n✨ Toutes les icônes ont été créées avec succès !")
print("📦 L'extension est maintenant complète et prête à être installée")
