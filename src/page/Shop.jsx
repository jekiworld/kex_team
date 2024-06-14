import React, { useRef, useCallback, useState, useEffect } from 'react';
import './style/Shop.css';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import CategoryButton from '../components/Shop/CategoryButton';
import categories from '../data/categories.json';
import dishes from '../data/dishes.json';
import DishList from '../components/Shop/DishList';
import Cart from '../components/Shop/Cart';
import { useNavigate } from 'react-router-dom';

export default function Shop() {
  const refs = useRef(categories.reduce((acc, value) => {
    acc[value] = React.createRef();
    return acc;
  }, {}));
  const [isSticky, setIsSticky] = useState(false);
  const navigate = useNavigate(); 

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    setIsSticky(scrollTop > 100);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = useCallback((category) => {
    const ref = refs.current[category];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [refs]);

  const handleAddClick = () => {
    navigate('/'); 
  };

  return (
    <div className='page_brand'>
      {isSticky && (
        <div className="sticky-header">
          <button onClick={handleAddClick} className="back-button">
            <ChevronLeftIcon w={6} h={6} />
          </button>
          <h1>Salam Bro</h1>
        </div>
      )}
      <div className="background">
        <img className='brand_im' src="https://www.kex.team/_next/image?url=https%3A%2F%2Fkexgroupcdn.fra1.cdn.digitaloceanspaces.com%2FPoints%2FSalamBro.png&w=1080&q=75" alt="Brand Image" />
      </div>
      <div className="back" onClick={handleAddClick}>
        <ChevronLeftIcon w={29} h={39} color="black" />
      </div>
      <div className="list_of_food">
        <div className="name_of_company">
          <h2 id='name_brand'>Salam Bro</h2>
          <p id='description'>Бургеры, хот доги, фри</p>
        </div>
        <div className="category">
          <CategoryButton categories={categories} onClick={handleClick} />
        </div>
        <div className="cat_list">
          {categories.map((category, index) => (
            <DishList key={index} category={{ name: category, ref: refs.current[category] }} dishes={dishes[category] || []} />
          ))}
        </div>
      </div>
      <Cart />
    </div>
  );
}
