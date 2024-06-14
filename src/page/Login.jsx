import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/Login.css';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    Heading,
    Link,
    VStack,
    Image,
    useToast
} from '@chakra-ui/react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleShowClick = () => setShowPassword(!showPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.token) {
                // Сохраняем токен в локальное хранилище или куки
                localStorage.setItem('token', data.token);
                toast({
                    title: "Вход выполнен успешно.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                // Перенаправление на страницу профиля
                navigate('/');
            } else {
                throw new Error('Invalid response data');
            }
        } catch (error) {
            toast({
                title: "Ошибка при входе.",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box className="login-container">
            <Image className='logo' src="https://www.kex.team/_next/image?url=%2Fimages%2Flogos%2Fkex-logo.png&w=1080&q=75" alt="logo" height="50px" width="100px" />

            <Box className="login-box">
                <VStack spacing={4} align="start">
                    <Heading as="h2" size="lg" className="center-text">Войти</Heading>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <FormControl id="email">
                            <FormLabel>Ваша электронная почта</FormLabel>
                            <InputGroup>
                                <Input
                                    type="email"
                                    placeholder="+7 | (700) 123 45 67"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </InputGroup>
                        </FormControl>
                        <FormControl id="password" mt={4}>
                            <FormLabel>Пароль</FormLabel>
                            <InputGroup>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <InputRightElement width="5rem">
                                    <Button h="1.5rem" size="sm" onClick={handleShowClick}>
                                        {showPassword ? 'Скрыть' : 'Показать'}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                        <Link href="/auth/recovery-password" color="rgb(129,105,195)" mt={2} display="block" textAlign="right">
                            Забыл пароль?
                        </Link>
                        <Button type="submit" color="white" bg="rgb(140, 86, 248)" width="full" mt={4}>
                            Войти
                        </Button>
                    </form>
                </VStack>
                <div className="forgot">
                    У вас нет учетной записи? <Link href="/register" fontWeight={200} color="Black">Зарегистрироваться</Link>
                </div>
            </Box>
        </Box>
    );
}
