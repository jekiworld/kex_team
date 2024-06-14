import React from 'react';
import './style/Home.css';
import { Box } from '@chakra-ui/react';
import Stories from '../components/Stories';
import Company from '../components/Company';
import stories from '../data/stories.json';
import companies from '../data/companies.json';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const handleToProfileOrLogin = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/profile');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className='page'>
            <header className='header'>
                <div className="logo_home">
                    <img className='img_logo_home' src="https://www.kex.team/_next/image?url=%2Fimages%2Flogos%2Fkex-logo.png&w=1080&q=75" alt="Kex Logo" />
                </div>
            </header>

            <div className="container_home">
                <div className="block_bonus">
                    <h2 id='h2'>Экслюзивные бонусы!</h2>
                    <p id='p'> <span id='span'>Регистируйся</span> сейчас и получай бонусы с каждой покупки! </p>
                </div>
            </div>

            <Box className='stories'>
                <Stories stories={stories} />
            </Box>

            <div className="menu">
                <h2 className="menu_h2 text-left">Меню</h2>
                <Company companies={companies} />
            </div>

            <nav className='nav'>
                <div className='icon_home'>
                    <img className='icon_home_svg' src="home.svg" alt="Home Icon" />
                    <p id='icon_main'>Главная</p>
                </div>

                <div className='icon_zakazy'>
                    <img className='icon_home_svg' src="book-alt.svg" alt="Orders Icon" />
                    <p id='icon_main'>Заказы</p>
                </div>

                <div onClick={handleToProfileOrLogin} className='icon_profile'>
                    <img className='icon_home_svg' src="user.svg" alt="User Icon" />
                    <p id='icon_main'>Профиль</p>
                </div>
            </nav>
        </div>
    );
};

export default Home;
