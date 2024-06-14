import React, { useState } from 'react';

function CategoryButton({ categories, onClick }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const toggleActive = (category) => {
    setActiveCategory(category);
    onClick(category); // Вызываем функцию onClick, переданную из родительского компонента
  };

  return categories.map((category, index) => (
    <button
      key={index}
      className={`category-button ${activeCategory === category ? 'active' : ''}`}
      onClick={() => toggleActive(category)}
    >
      <p id='text_category'>{category}</p>
    </button>
  ));
}

export default CategoryButton;
