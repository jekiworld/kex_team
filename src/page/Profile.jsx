import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Heading, Text, VStack, Avatar } from '@chakra-ui/react';
import './style/Profile.css';

export default function Profile() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to logout');
            }

            localStorage.removeItem('token');
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (!user) {
        return <Text>Loading...</Text>;
    }

    return (
        <Box className="profile-container">
            <VStack spacing={4} align="center">
                <Avatar name={`${user.first_name} ${user.last_name}`} size="xl" />
                <Heading as="h2" size="lg">Профиль</Heading>
                <Text><strong>Имя:</strong> {user.first_name}</Text>
                <Text><strong>Фамилия:</strong> {user.last_name}</Text>
                <Text><strong>Email:</strong> {user.email}</Text>
                <Text><strong>Номер телефона:</strong> {user.phone}</Text>
                <Button colorScheme="red" onClick={handleLogout}>Выйти</Button>
            </VStack>
        </Box>
    );
}
