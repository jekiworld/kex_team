import React, { useState, useEffect } from 'react';
import { Box, Image, Skeleton, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, Progress } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const Stories = ({ stories }) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (selectedStory) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            handleNextStory();
            return 100;
          }
          return prev + 1;
        });
      }, 30); 
      return () => clearInterval(interval);
    }
  }, [selectedStory]);

  const handleImageClick = (story, index) => {
    setSelectedStory(story);
    setCurrentStoryIndex(index);
  };

  const handleClose = () => {
    setSelectedStory(null);
    setCurrentStoryIndex(0);
  };

  const handleNextStory = () => {
    const nextIndex = (currentStoryIndex + 1) % stories.length;
    setCurrentStoryIndex(nextIndex);
    setSelectedStory(stories[nextIndex]);
  };

  return (
    <Box className="stories-container">
      {stories.map((story, index) => (
        <Box key={index} className="story" onClick={() => handleImageClick(story, index)}>
          <Skeleton isLoaded={true} className="chakra-skeleton">
            <Image 
              alt={story.alt} 
              src={story.src} 
              loading="lazy" 
              decoding="async" 
              sizes="(max-width: 768px) 20vw, 80vw" 
              srcSet={story.srcSet} 
              style={{
                objectFit: 'cover', 
                color: 'transparent',
                cursor: 'pointer'
              }} 
            />
          </Skeleton>
        </Box>
      ))}

      <AnimatePresence>
        {selectedStory && (
          <Modal isOpen={!!selectedStory} onClose={handleClose} size="full">
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton className='close_button' onClick={handleClose} />
              <ModalBody display="flex" justifyContent="center" alignItems="center" p={0} position="relative">
                <motion.div
                  key={selectedStory.src}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Image 
                    alt={selectedStory.alt} 
                    src={selectedStory.src} 
                    style={{
                      maxHeight: '100vh',
                      maxWidth: '100vw',
                      objectFit: 'contain'
                    }} 
                  />
                </motion.div>
                <Progress
                  value={progress}
                  size="xs"
                  colorScheme="pink"
                  position="absolute"
                  top="0"
                  left="0"
                  width="100%"
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Stories;
