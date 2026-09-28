const promotions = [
  {
    eyebrow: 'Temporada',
    title: 'Mañanas con calma',
    text: 'Cafe filtrado y pan recien horneado para empezar despacio.',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
  },
  {
    eyebrow: 'Favorito de la casa',
    title: 'Latte + dulce',
    text: 'Combina tu bebida favorita con cualquier pieza de pan dulce.',
    image:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
  },
];

const productImages = {
  espresso:
    'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=700&q=82',
  latte:
    'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=700&q=82',
  cold:
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=82',
  matcha:
    'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=700&q=82',
  pastry:
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=82',
  breakfast:
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=82',
};

export { promotions };

export function getProductImage(product) {
  const name = product.nombre.toLowerCase();

  if (name.includes('espresso')) return productImages.espresso;
  if (name.includes('latte')) return productImages.latte;
  if (name.includes('cold')) return productImages.cold;
  if (name.includes('matcha')) return productImages.matcha;
  if (name.includes('toast') || name.includes('sandwich') || name.includes('yogurt')) {
    return productImages.breakfast;
  }

  return productImages.pastry;
}