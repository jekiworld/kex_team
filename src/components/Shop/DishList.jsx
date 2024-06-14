import React, { useState } from 'react';
import FullScreenModal from './FullScreenModal';  // Import the modal component

const DishList = ({ category, dishes }) => {
  const [modalShow, setModalShow] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);

  const openModal = (dish) => {
    setSelectedDish(dish);
    setModalShow(true);
  };

  const closeModal = () => {
    setModalShow(false);
    setSelectedDish(null);
  };

  return (
    <div className='container3' ref={category.ref}>
      <h2>{category.name}</h2>``
      <div className="dish_container">
        <div className="dish">
          {dishes && dishes.length > 0 ? (
            dishes.map((dish, index) => (
              <div key={index} className="dish-item">
                <img src={dish.image} alt={dish.name} className="dish-image" />
                <h3>{dish.name}</h3>
                <p id='des'>{dish.description}</p>
                <p id='price'>{dish.price} Т</p>
                <button className="button-add" onClick={() => openModal(dish)}>+ Добавить</button>
              </div>
            ))
          ) : (
            <p>Нет блюд в этой категории.</p>
          )}
        </div>
      </div>
      <FullScreenModal show={modalShow} onClose={closeModal} dish={selectedDish}>
        <div>
          <h1>{selectedDish?.name}</h1>
        </div>
      </FullScreenModal>
    </div>
  );
};

export default DishList;
