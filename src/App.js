// App.js
import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './page/Home';
import Login from './page/Login';
import { ChakraProvider } from '@chakra-ui/react';
import Shop from './page/Shop'
import Register from './page/Register';
import Profile from './page/Profile';
import FullScreenModal from './components/Shop/FullScreenModal'
import Exp from './page/Exp';
import { CartProvider } from './context/CartContext';


function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />
    },
    {
      path: "/login",
      element: <Login />
    },

    {
      path: "/brand",
      element: <Shop />
    },

    {
      path: "/register",
      element: <Register />
    },

    {
      path: "/profile",
      element: <Profile />
    },

    {
      path: "/modal",
      element: <FullScreenModal />
    },
    {
      path: "/ex",
      element: <Exp />
    }
  ]);

  return (
    <ChakraProvider>
      <CartProvider>
        <div className="App">
          <RouterProvider router={router} />
        </div>
      </CartProvider>
    </ChakraProvider>
  );
}

export default App;
