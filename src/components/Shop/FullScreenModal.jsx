import React, { useEffect, useState } from 'react';
import './fullscreenmodal.css';
import { Button, Text, Box, Flex, Checkbox, CheckboxGroup, Stack } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useCart } from '../../context/CartContext'; 

const ingredients = [
  { name: 'Соус острый (лазджан)', price: 100 },
  { name: 'Халопеньо', price: 150 },
  { name: 'Сыр', price: 150 }
];

const FullScreenModal = ({ show, onClose, dish }) => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : 'visible';
    return () => {
      document.body.style.overflow = 'visible';
    };
  }, [show]);

  const handleIngredientChange = (values) => {
    setSelectedIngredients(values.map(value => parseInt(value, 10)));
  };

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    const totalAdditionalPrice = selectedIngredients.reduce((acc, curr) => acc + ingredients[curr].price, 0);
    const totalPrice = (dish.price + totalAdditionalPrice) * quantity;
    const cartItem = {
      ...dish,
      ingredients: selectedIngredients,
      quantity,
      price: totalPrice
    };
    addToCart(cartItem);
    onClose();
  };

  if (!show) {
    return null;
  }

  const totalAdditionalPrice = selectedIngredients.reduce((acc, curr) => acc + ingredients[curr].price, 0);
  const totalPrice = ((dish?.price || 0) + totalAdditionalPrice) * quantity;

  return (
    <div className='modal_container'>
      <div className='content'>
        <div className="background_product">
          <div className="image_list">
            <img src={dish?.image} alt="" className="background_im" />
          </div>
          <div className="back_food" onClick={onClose}>
            <ChevronLeftIcon w={29} h={39} color="black" />
          </div>
          <div className="more_info">
            <h2>{dish?.name}</h2>
            <p className="description_of_food">{dish?.description}</p>
          </div>
          <div className="add_component">
            <Box className="css-rszk63">
              <Box className="css-szr1g5">
                <Text fontSize="12px" fontWeight="medium" mb={2}>Доп. ингредиенты</Text>
              </Box>
              <CheckboxGroup onChange={handleIngredientChange}>
                <Stack spacing={2}>
                  {ingredients.map((ingredient, index) => (
                    <Checkbox key={index} value={index.toString()} className="css-iq8m7f">
                      <Box display="flex" justifyContent="space-between" w="full">
                        <Text className="chakra-text">{`- ${ingredient.name}`}</Text>
                        <Text className="chakra-text">{`+${ingredient.price} ₸`}</Text>
                      </Box>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </Box>
          </div>
          <div className="price_food">
            <Box className="css-1tn63uy" p={4} boxShadow="md" bg="white">
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Text fontSize="lg">Цена: {totalPrice} ₸</Text>
                <Text fontSize="xl" fontWeight="bold">₸</Text>
              </Flex>
              <div className="bot">
                <Flex borderRadius={10} className='css' justifyContent="center" alignItems="center" mb={4}>
                  <Button onClick={handleDecreaseQuantity} isDisabled={quantity <= 1}>-</Button>
                  <Text px={4}>{quantity}</Text>
                  <Button onClick={handleIncreaseQuantity}>+</Button>
                </Flex>
                <Button onClick={handleAddToCart} bg="rgb(140, 86, 248)" color="white" isFullWidth>Добавить в корзину</Button>
              </div>
            </Box>
          </div>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default FullScreenModal;
