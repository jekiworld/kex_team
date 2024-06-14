import React, { useState } from 'react';
import { useCart } from '../../context/CartContext'; // Ensure correct path
import './Cart.css';



const Cart = () => {
  const { cartItems, getTotalPrice } = useCart();

  const [modalShow, setModalShow] = useState(false);

  const openModal = () =>{
    setModalShow(true);
  }

  return (
    <div className='cart'>
      <h2>Корзина</h2>
      {cartItems.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              <p>{item.name} x {item.quantity}</p>
              <p>{item.price} ₸</p>
            </li>
          ))}
        </ul>
      )}
      <h3>Итого: {getTotalPrice()} ₸</h3>
      <button className='border_card'> Купить </button>
    </div>
  );
};

export default Cart;
