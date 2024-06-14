// src/components/Stories.js
import React from 'react';
import {
    Image
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';


const Company = ({ companies }) => {

    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/brand');
    };
    return (
        <div onClick={handleBack} className="company_contianer">
            {companies.map((company, index) => (
                <Image className='comp_img' key={index}
                    borderRadius='10px'
                    width='100%'
                    src={company.src}
                    alt={company.alt}
                />


            )

            )}

        </div>
    );
};

export default Company;
