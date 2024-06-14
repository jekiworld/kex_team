import React, { useState } from 'react';
import './style/Register.css';
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
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Text
} from '@chakra-ui/react';

export default function Register() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        password: '',
        confirm_password: '',
        phone: ''
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [isVerificationSuccessful, setIsVerificationSuccessful] = useState(false);

    const handleShowClick = () => setShowPassword(!showPassword);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleVerificationChange = (e) => {
        setVerificationCode(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                setUserPhone(formData.phone);
                onOpen();
            } else {
                alert(`Registration failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Registration failed: Unable to connect to the server.');
        }
    };

    const handleVerificationSubmit = async () => {
        try {
            const response = await fetch('http://localhost:8080/verify_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: userPhone, code: verificationCode })
            });
            const data = await response.json();
            if (response.ok) {
                setIsVerificationSuccessful(true);
            } else {
                alert(`Verification failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Verification failed: Unable to connect to the server.');
        }
    };

    return (
        <Box className="register-container">
            <Image className='logo' src="https://www.kex.team/_next/image?url=%2Fimages%2Flogos%2Fkex-logo.png&w=1080&q=75" alt="logo" height="50px" width="100px" />

            <Box className="register-box">
                <VStack spacing={4} align="start">
                    <Heading as="h2" size="lg" className="center-text">Зарегистрироваться</Heading>
                    <form className="register-form" onSubmit={handleSubmit}>
                        <div className="name_surn">
                            <FormControl id="first_name">
                                <FormLabel>Имя</FormLabel>
                                <InputGroup>
                                    <Input type="text" placeholder="Имя" value={formData.first_name} onChange={handleChange} />
                                </InputGroup>
                            </FormControl>
                            <FormControl id="last_name">
                                <FormLabel>Фамилия</FormLabel>
                                <InputGroup>
                                    <Input type="text" placeholder="Фамилия" value={formData.last_name} onChange={handleChange} />
                                </InputGroup>
                            </FormControl>
                        </div>
                        <FormControl id="email" mt={4}>
                            <FormLabel>Email</FormLabel>
                            <InputGroup>
                                <Input type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
                            </InputGroup>
                        </FormControl>
                        <FormControl id="username" mt={4}>
                            <FormLabel>Логин</FormLabel>
                            <InputGroup>
                                <Input type="text" placeholder="Логин" value={formData.username} onChange={handleChange} />
                            </InputGroup>
                        </FormControl>
                        <FormControl id="phone" mt={4}>
                            <FormLabel>Ваш номер телефона</FormLabel>
                            <InputGroup>
                                <Input type="tel" placeholder="+7 | (700) 123 45 67" value={formData.phone} onChange={handleChange} />
                            </InputGroup>
                        </FormControl>
                        <FormControl id="password" mt={4}>
                            <FormLabel>Пароль</FormLabel>
                            <InputGroup>
                                <Input type={showPassword ? 'text' : 'password'} placeholder="Пароль" value={formData.password} onChange={handleChange} />
                                <InputRightElement width="5rem">
                                    <Button h="1.5rem" size="sm" onClick={handleShowClick}>
                                        {showPassword ? 'Скрыть' : 'Показать'}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                        <FormControl id="confirm_password" mt={4}>
                            <FormLabel>Подтвердите Пароль</FormLabel>
                            <InputGroup>
                                <Input type={showPassword ? 'text' : 'password'} placeholder="Подтвердите Пароль" value={formData.confirm_password} onChange={handleChange} />
                                <InputRightElement width="5rem">
                                    <Button h="1.5rem" size="sm" onClick={handleShowClick}>
                                        {showPassword ? 'Скрыть' : 'Показать'}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                        <Button type="submit" color="white" bg="rgb(140, 86, 248)" width="full" mt={4}>
                            Зарегистрироваться
                        </Button>
                    </form>
                </VStack>
                <div className="forgot">
                    Уже есть учетная запись? <Link href="/auth/login" fontWeight={200} color="Black">Войти</Link>
                </div>
            </Box>

            {/* Modal for verification */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent mt ={280} width={350}>
                    <ModalHeader>{isVerificationSuccessful ? "Регистрация успешна" : "Введите код подтверждения"}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {isVerificationSuccessful ? (
                            <Text>Вы успешно зарегистрированы.</Text>
                        ) : (
                            <FormControl>
                                <Input type="text" placeholder="Введите код" value={verificationCode} onChange={handleVerificationChange} />
                            </FormControl>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        {isVerificationSuccessful ? (
                            <Link href="/login" color="rgb(140, 86, 248)">Авторизоваться</Link>
                        ) : (
                            <>
                                <Button bg="rgb(140, 86, 248)" color = "white" mr={3} onClick={handleVerificationSubmit}>
                                    Подтвердить
                                </Button>
                                <Button variant="ghost" onClick={onClose}>Отмена</Button>
                            </>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
